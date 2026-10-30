import { NextRequest, NextResponse } from "next/server";
import { otpRequestSchema } from "@/lib/validation/schemas";
import { requestOtp } from "@/lib/auth/otp";
import { sanitizeError } from "@/lib/errors/app-error";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = otpRequestSchema.parse(body);

    // Extract client IP address for rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    const result = await requestOtp(validated.mobileNumber, ipAddress);

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      resendAfterSeconds: result.resendAfterSeconds,
      devOtp: result.devOtp, // Only present in non-production
    });
  } catch (error) {
    const sanitized = sanitizeError(error);
    return NextResponse.json({ error: sanitized.message, code: sanitized.code }, { status: sanitized.statusCode });
  }
}
