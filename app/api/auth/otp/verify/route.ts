import { NextRequest, NextResponse } from "next/server";
import { otpVerifySchema } from "@/lib/validation/schemas";
import { verifyOtp } from "@/lib/auth/otp";
import { medicalRepo } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { sanitizeError, AppError } from "@/lib/errors/app-error";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = otpVerifySchema.parse(body);

    // 1. Verify OTP cryptographic challenge
    const { mobileNumber: normalizedMobile } = await verifyOtp(validated.mobileNumber, validated.otp);

    // 2. Retrieve or provision user account
    let user = await medicalRepo.getUserByMobile(normalizedMobile);
    if (!user) {
      user = await medicalRepo.getUserByMobile(validated.mobileNumber);
    }

    if (!user) {
      const requestedRole = (body.role as string)?.toUpperCase();
      const fullName = (body.fullName as string)?.trim();

      if (requestedRole === "DOCTOR") {
        const created = await medicalRepo.createDoctorUser(normalizedMobile, fullName || "Dr. Medical Practitioner");
        user = created.user;
      } else if (requestedRole === "ADMIN") {
        const created = await medicalRepo.createAdminUser(normalizedMobile, fullName || "Platform Administrator");
        user = created.user;
      } else {
        const created = await medicalRepo.createPatientUser(normalizedMobile, fullName || "New Patient");
        user = created.user;
      }
    }

    if (user.status === "SUSPENDED") {
      throw AppError.forbidden("Your account has been suspended. Please contact hospital administration.");
    }

    // 3. Establish secure session
    await createSession(user.id, user.role);

    // 4. Determine destination route based on verified server-side role
    let redirectTo = "/dashboard";
    if (user.role === "DOCTOR") {
      redirectTo = "/doctor/dashboard";
    } else if (user.role === "ADMIN") {
      redirectTo = "/admin/dashboard";
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
      redirectTo,
    });
  } catch (error) {
    const sanitized = sanitizeError(error);
    return NextResponse.json({ error: sanitized.message, code: sanitized.code }, { status: sanitized.statusCode });
  }
}
