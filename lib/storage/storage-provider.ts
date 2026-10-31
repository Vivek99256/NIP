import fs from "fs/promises";
import path from "path";
import os from "os";
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
  storageProvider: "LOCAL" | "S3" | "SUPABASE";
}

export interface StorageProvider {
  readonly providerName: "LOCAL" | "S3" | "SUPABASE";
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
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    this.uploadDir = isServerless
      ? path.join(os.tmpdir(), "uploads")
      : path.join(process.cwd(), "uploads");
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

/**
 * Supabase Storage Provider (High-Performance Cloud S3 / Object Storage)
 * Used in production and Vercel deployments to ensure persistent cloud uploads.
 */
export class SupabaseStorageProvider implements StorageProvider {
  readonly providerName = "SUPABASE" as const;
  private supabaseUrl: string;
  private apiKey: string;
  private bucket: string;

  constructor() {
    this.supabaseUrl = (
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lukdpggxqsdibyfxwezm.supabase.co"
    ).replace(/\/$/, "");
    this.apiKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_dl2dkgzBOzqbz8pqCH4HnQ_zeSWmvTg";
    this.bucket = "medical-documents";
  }

  async saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileMetadata> {
    validateFileMetadata(originalFilename, mimeType, buffer.length);
    const ext = path.extname(originalFilename).toLowerCase();
    const storageKey = `${crypto.randomUUID()}${ext}`;
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${encodeURIComponent(storageKey)}`;
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": mimeType,
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[SUPABASE_STORAGE_ERROR] Upload failed:", res.status, errBody);
      throw AppError.internal("Failed to upload file to cloud storage. Please try again.");
    }

    return {
      storageKey,
      originalFilename: path.basename(originalFilename),
      mimeType,
      fileSize: buffer.length,
      checksum,
      storageProvider: "SUPABASE",
    };
  }

  async getDownloadUrl(storageKey: string, expiresInSeconds: number = 300): Promise<string> {
    const token = crypto
      .createHmac("sha256", process.env.SESSION_SECRET || "fallback_secret")
      .update(`${storageKey}:${Math.floor(Date.now() / 1000) + expiresInSeconds}`)
      .digest("hex");
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `/api/documents/download?key=${encodeURIComponent(storageKey)}&token=${token}&expires=${expires}`;
  }

  async getFileStream(storageKey: string): Promise<{ stream: Buffer; mimeType: string; filename: string }> {
    const ext = path.extname(storageKey).toLowerCase();
    let defaultMime = "application/octet-stream";
    if (ext === ".png") defaultMime = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") defaultMime = "image/jpeg";
    else if (ext === ".webp") defaultMime = "image/webp";
    else if (ext === ".pdf") defaultMime = "application/pdf";

    // 1. Try authenticated Supabase download endpoint
    let res = await fetch(
      `${this.supabaseUrl}/storage/v1/object/authenticated/${this.bucket}/${encodeURIComponent(storageKey)}`,
      {
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    ).catch(() => null);

    // 2. If authenticated failed, try public endpoint
    if (!res || !res.ok) {
      res = await fetch(
        `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${encodeURIComponent(storageKey)}`
      ).catch(() => null);
    }

    // 3. If Supabase succeeded, return stream
    if (res && res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const stream = Buffer.from(arrayBuffer);
      let mimeType = res.headers.get("content-type") || defaultMime;
      if (mimeType === "application/octet-stream" || !mimeType) {
        mimeType = defaultMime;
      }
      return {
        stream,
        mimeType,
        filename: path.basename(storageKey),
      };
    }

    // 4. Local fallback check
    const localFallback = new LocalStorageProvider();
    return localFallback.getFileStream(storageKey);
  }

  async deleteFile(storageKey: string): Promise<void> {
    const deleteUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${encodeURIComponent(storageKey)}`;
    await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
      },
    }).catch(() => {});
  }
}

let activeStorage: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (activeStorage) return activeStorage;

  const providerType = (process.env.STORAGE_PROVIDER || "").toUpperCase();

  // 1. Explicit S3
  if (providerType === "S3" && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
    activeStorage = new S3StorageProvider();
    return activeStorage;
  }

  // 2. Supabase Cloud Storage (Preferred in production and serverless environments)
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (providerType === "SUPABASE" || (hasSupabase && (process.env.VERCEL || providerType !== "LOCAL"))) {
    activeStorage = new SupabaseStorageProvider();
    return activeStorage;
  }

  // 3. Explicit Local or fallback
  activeStorage = new LocalStorageProvider();
  return activeStorage;
}
