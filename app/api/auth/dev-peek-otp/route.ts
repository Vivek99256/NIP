import { NextRequest, NextResponse } from "next/server";
import { DevOtpStore } from "@/lib/sms/sms-provider";
import { normalizePhoneNumber } from "@/lib/validation/phone";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.SMS_PROVIDER !== "MOCK_PROD_TEST") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawMobile = searchParams.get("mobileNumber") || "";
  if (!rawMobile) {
    return NextResponse.json({ otp: null });
  }

  try {
    const mobile = normalizePhoneNumber(rawMobile);
    const otp = DevOtpStore.get(mobile);
    return NextResponse.json({ otp: otp || null });
  } catch {
    return NextResponse.json({ otp: null });
  }
}
