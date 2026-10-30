import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { AppError } from "@/lib/errors/app-error";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StoredFileMetadata {
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  storageProvider: "LOCAL" | "S3";
}

export interface StorageProvider {
  readonly providerName: "LOCAL" | "S3";
  saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileMetadata>;
  getDownloadUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
  getFileStream(storageKey: string): Promise<{ stream: Buffer; mimeType: string; filename: string }>;
  deleteFile(storageKey: string): Promise<void>;
}

// Allowlist supported MIME types & extensions
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export function validateFileMetadata(originalFilename: string, mimeType: string, fileSize: number) {
  if (fileSize <= 0) {
    throw AppError.badRequest("Uploaded file is empty");
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw AppError.badRequest(`File exceeds maximum allowed size of 15 MB (received ${(fileSize / (1024 * 1024)).toFixed(1)} MB)`);
  }

  const allowedExts = ALLOWED_MIME_TYPES[mimeType];
  if (!allowedExts) {
    throw AppError.badRequest(`Unsupported file type: ${mimeType}. Allowed formats: PDF, JPEG, PNG, WEBP.`);
  }

  const ext = path.extname(originalFilename).toLowerCase();
  if (!allowedExts.includes(ext)) {
    throw AppError.badRequest(`File extension "${ext}" does not match declared MIME type "${mimeType}"`);
  }
}

/**
 * Local Disk Private Storage Provider
 * Files stored inside secure private directory (not served directly via public/)
 */
export class LocalStorageProvider implements StorageProvider {
  readonly providerName = "LOCAL" as const;
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "uploads");
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // Ignore if exists
    }
  }

  async saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileMetadata> {
    validateFileMetadata(originalFilename, mimeType, buffer.length);
    await this.ensureDir();

    const ext = path.extname(originalFilename).toLowerCase();
    // Cryptographic random storage key prevents path traversal and guessing
    const storageKey = `${crypto.randomUUID()}${ext}`;
    const destinationPath = path.join(this.uploadDir, storageKey);

    // Compute SHA-256 checksum
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    await fs.writeFile(destinationPath, buffer);

    return {
      storageKey,
      originalFilename: path.basename(originalFilename),
      mimeType,
      fileSize: buffer.length,
      checksum,
      storageProvider: "LOCAL",
    };
  }

  async getDownloadUrl(storageKey: string, expiresInSeconds: number = 300): Promise<string> {
    // For local storage, returns a secure internal API streaming endpoint with token
    const token = crypto.createHmac("sha256", process.env.SESSION_SECRET || "fallback_secret")
      .update(`${storageKey}:${Math.floor(Date.now() / 1000) + expiresInSeconds}`)
      .digest("hex");
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `/api/documents/download?key=${encodeURIComponent(storageKey)}&token=${token}&expires=${expires}`;
  }

  async getFileStream(storageKey: string): Promise<{ stream: Buffer; mimeType: string; filename: string }> {
    // Sanitize storage key to strictly prevent path traversal
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);

    try {
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(safeKey).toLowerCase();
      let mimeType = "application/octet-stream";
      for (const [mime, exts] of Object.entries(ALLOWED_MIME_TYPES)) {
        if (exts.includes(ext)) {
          mimeType = mime;
          break;
        }
      }
      return { stream: buffer, mimeType, filename: safeKey };
    } catch {
      throw AppError.notFound("Requested file does not exist on storage");
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if already deleted
    }
  }
}

/**
 * S3 Compatible Private Storage Provider (AWS S3, MinIO, Cloudflare R2)
 */
export class S3StorageProvider implements StorageProvider {
  readonly providerName = "S3" as const;
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || "medrec-private-documents";
    this.s3Client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    });
  }

  async saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileMetadata> {
    validateFileMetadata(originalFilename, mimeType, buffer.length);
    const ext = path.extname(originalFilename).toLowerCase();
    const storageKey = `medrec/${crypto.randomUUID()}${ext}`;
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          originalFilename: encodeURIComponent(originalFilename),
          checksum,
        },
      })
    );

    return {
      storageKey,
      originalFilename: path.basename(originalFilename),
      mimeType,
      fileSize: buffer.length,
      checksum,
      storageProvider: "S3",
    };
  }

  async getDownloadUrl(storageKey: string, expiresInSeconds: number = 300): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  async getFileStream(storageKey: string): Promise<{ stream: Buffer; mimeType: string; filename: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });
    const response = await this.s3Client.send(command);
    const stream = Buffer.from(await response.Body?.transformToByteArray() || []);
    return {
      stream,
      mimeType: response.ContentType || "application/octet-stream",
      filename: path.basename(storageKey),
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      })
    );
  }
}

let activeStorage: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (activeStorage) return activeStorage;

  const providerType = (process.env.STORAGE_PROVIDER || "LOCAL").toUpperCase();
  if (providerType === "S3" && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
    activeStorage = new S3StorageProvider();
  } else {
    activeStorage = new LocalStorageProvider();
  }

  return activeStorage;
}
