import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization/rbac";
import { getStorageProvider } from "@/lib/storage/storage-provider";
import { sanitizeError, AppError } from "@/lib/errors/app-error";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string | null;
    const entityId = formData.get("entityId") as string | null;

    if (!file) {
      throw AppError.badRequest("No file uploaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storage = getStorageProvider();
    const result = await storage.saveFile(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      fileId: result.storageKey,
      filename: result.originalFilename,
      size: result.fileSize,
      mimeType: result.mimeType,
    });
  } catch (error) {
    console.error("[API_UPLOADS_ERROR]", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json({ error: sanitized.message, code: sanitized.code }, { status: sanitized.statusCode });
  }
}
