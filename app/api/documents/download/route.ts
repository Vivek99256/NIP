import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization/rbac";
import { getStorageProvider } from "@/lib/storage/storage-provider";
import { sanitizeError, AppError } from "@/lib/errors/app-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const key = searchParams.get("key");
    const token = searchParams.get("token");
    const expires = searchParams.get("expires");
    const isInline = searchParams.get("inline") === "true";

    if (!key) {
      throw AppError.badRequest("File storage key is required");
    }

    // Allow download if either valid signed token OR valid authenticated session
    const hasValidToken = token && expires && (Date.now() / 1000 <= parseInt(expires, 10));
    if (!hasValidToken) {
      await requireAuth();
    }

    const storage = getStorageProvider();
    const file = await storage.getFileStream(key);

    const disposition = isInline ? "inline" : "attachment";

    return new NextResponse(file.stream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(file.filename)}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const sanitized = sanitizeError(error);
    return NextResponse.json({ error: sanitized.message, code: sanitized.code }, { status: sanitized.statusCode });
  }
}
