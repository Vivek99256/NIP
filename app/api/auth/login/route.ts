import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/schemas";
import { normalizePhoneNumber } from "@/lib/validation/phone";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { medicalRepo } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { sanitizeError, AppError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    // Normalize phone number
    let normalizedMobile: string;
    try {
      normalizedMobile = normalizePhoneNumber(validated.mobileNumber);
    } catch {
      normalizedMobile = validated.mobileNumber.replace(/\s+/g, "");
    }

    // 1. Retrieve user
    let user = await medicalRepo.getUserByMobile(normalizedMobile);
    if (!user) {
      user = await medicalRepo.getUserByMobile(validated.mobileNumber);
    }

    // 2. If user does not exist, auto-provision account
    if (!user) {
      const requestedRole = (validated.role || body.role as string)?.toUpperCase();
      const fullName = (validated.fullName || body.fullName as string)?.trim();
      const hashedPassword = hashPassword(validated.password);

      if (requestedRole === "DOCTOR") {
        const created = await medicalRepo.createDoctorUser(
          normalizedMobile,
          fullName || "Dr. Medical Practitioner",
          undefined,
          undefined,
          hashedPassword
        );
        user = created.user;
      } else if (requestedRole === "ADMIN") {
        const created = await medicalRepo.createAdminUser(
          normalizedMobile,
          fullName || "Platform Administrator",
          hashedPassword
        );
        user = created.user;
      } else {
        const created = await medicalRepo.createPatientUser(
          normalizedMobile,
          fullName || "New Patient",
          hashedPassword
        );
        user = created.user;
      }
    } else {
      // 3. User exists -> Verify password
      if (user.passwordHash) {
        const isValid = verifyPassword(validated.password, user.passwordHash);
        if (!isValid) {
          throw AppError.unauthorized("Incorrect password. Please try again.");
        }
      } else {
        // If legacy account with no password yet, set password on first login
        const hashedPassword = hashPassword(validated.password);
        await medicalRepo.setUserPassword(user.id, hashedPassword);
      }
    }

    // 4. Verify account status
    if (user.status === "SUSPENDED") {
      throw AppError.forbidden("Your account has been suspended. Please contact hospital administration.");
    }

    // 5. Establish secure session
    await createSession(user.id, user.role);

    // 6. Route destination based on role
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

