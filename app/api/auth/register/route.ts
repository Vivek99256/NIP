import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/schemas";
import { normalizePhoneNumber } from "@/lib/validation/phone";
import { hashPassword } from "@/lib/auth/password";
import { medicalRepo } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { sanitizeError, AppError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    let normalizedMobile: string;
    try {
      normalizedMobile = normalizePhoneNumber(validated.mobileNumber);
    } catch {
      normalizedMobile = validated.mobileNumber.replace(/\s+/g, "");
    }

    // 1. Check if user already exists
    let existingUser = await medicalRepo.getUserByMobile(normalizedMobile);
    if (!existingUser) {
      existingUser = await medicalRepo.getUserByMobile(validated.mobileNumber);
    }

    if (existingUser) {
      throw AppError.conflict("An account with this mobile number already exists. Please sign in instead.");
    }

    // 2. Hash password
    const hashedPassword = hashPassword(validated.password);

    // 3. Create account
    let user;
    if (validated.role === "DOCTOR") {
      const created = await medicalRepo.createDoctorUser(
        normalizedMobile,
        validated.fullName,
        validated.specialty || "General Medicine",
        "MBBS, MD",
        hashedPassword
      );
      user = created.user;
    } else if (validated.role === "ADMIN") {
      const created = await medicalRepo.createAdminUser(
        normalizedMobile,
        validated.fullName,
        hashedPassword
      );
      user = created.user;
    } else {
      const created = await medicalRepo.createPatientUser(
        normalizedMobile,
        validated.fullName,
        hashedPassword
      );
      user = created.user;
    }

    // 4. Create session
    await createSession(user.id, user.role);

    // 5. Determine destination
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
    return NextResponse.json(
      { error: sanitized.message, code: sanitized.code },
      { status: sanitized.statusCode }
    );
  }
}

