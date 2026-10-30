import { describe, it, expect } from "vitest";
import { validateFileMetadata, LocalStorageProvider } from "@/lib/storage/storage-provider";

describe("Secure Private Storage & File Validation", () => {
  it("accepts allowed MIME types (PDF, JPEG, PNG, WEBP)", () => {
    expect(() => validateFileMetadata("report.pdf", "application/pdf", 1024)).not.toThrow();
    expect(() => validateFileMetadata("scan.jpg", "image/jpeg", 2048)).not.toThrow();
    expect(() => validateFileMetadata("xray.png", "image/png", 4096)).not.toThrow();
    expect(() => validateFileMetadata("image.webp", "image/webp", 2048)).not.toThrow();
  });

  it("rejects disallowed or potentially active file types (EXE, SVG, HTML)", () => {
    expect(() => validateFileMetadata("malware.exe", "application/x-msdownload", 1024)).toThrow(/Unsupported file type/);
    expect(() => validateFileMetadata("vector.svg", "image/svg+xml", 1024)).toThrow(/Unsupported file type/);
    expect(() => validateFileMetadata("index.html", "text/html", 1024)).toThrow(/Unsupported file type/);
  });

  it("rejects empty files or files exceeding maximum 15MB limit", () => {
    expect(() => validateFileMetadata("empty.pdf", "application/pdf", 0)).toThrow(/Uploaded file is empty/);
    expect(() => validateFileMetadata("huge.pdf", "application/pdf", 16 * 1024 * 1024)).toThrow(/exceeds maximum allowed size/);
  });

  it("rejects mismatched extensions and MIME types", () => {
    // Attempting to upload executable disguised as pdf
    expect(() => validateFileMetadata("exploit.exe", "application/pdf", 1024)).toThrow(/does not match declared MIME type/);
  });

  it("generates cryptographic storage keys and prevents path traversal", async () => {
    const storage = new LocalStorageProvider();
    const fakePdfBuffer = Buffer.from("%PDF-1.4 sample content");
    const result = await storage.saveFile(fakePdfBuffer, "../../../etc/passwd.pdf", "application/pdf");

    // Key must not contain directory traversal slashes
    expect(result.storageKey).not.toContain("/");
    expect(result.storageKey).not.toContain("\\");
    expect(result.storageKey).toMatch(/\.pdf$/);
    expect(result.originalFilename).toBe("passwd.pdf"); // Strips traversal path
  });
});
