"use server";

import { requestOtp, verifyOtp } from "@/lib/auth/otp";
import { medicalRepo } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { otpRequestSchema, otpVerifySchema } from "@/lib/validation/schemas";
import { sanitizeError, AppError } from "@/lib/errors/app-error";

export async function requestOtpAction(formData: { mobileNumber: string }) {
  try {
    const validated = otpRequestSchema.parse(formData);
    const result = await requestOtp(validated.mobileNumber);
    return {
      success: true,
      message: "Verification code sent to your mobile",
      resendAfterSeconds: result.resendAfterSeconds,
      devOtp: result.devOtp,
    };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function verifyOtpAction(formData: { mobileNumber: string; otp: string; fullName?: string; role?: string }) {
  try {
    const validated = otpVerifySchema.parse(formData);
    const { mobileNumber: normalizedMobile } = await verifyOtp(validated.mobileNumber, validated.otp);

    let user = await medicalRepo.getUserByMobile(normalizedMobile);
    if (!user) {
      user = await medicalRepo.getUserByMobile(validated.mobileNumber);
    }

    if (!user) {
      const requestedRole = formData.role?.toUpperCase();
      if (requestedRole === "DOCTOR") {
        const created = await medicalRepo.createDoctorUser(normalizedMobile, formData.fullName || "Dr. Medical Practitioner");
        user = created.user;
      } else if (requestedRole === "ADMIN") {
        const created = await medicalRepo.createAdminUser(normalizedMobile, formData.fullName || "Platform Administrator");
        user = created.user;
      } else {
        const created = await medicalRepo.createPatientUser(normalizedMobile, formData.fullName || "New Patient");
        user = created.user;
      }
    }

    if (user.status === "SUSPENDED") {
      throw AppError.forbidden("Account is suspended. Please contact administrator.");
    }

    await createSession(user.id, user.role);

    let redirectTo = "/dashboard";
    if (user.role === "DOCTOR") redirectTo = "/doctor/dashboard";
    if (user.role === "ADMIN") redirectTo = "/admin/dashboard";

    return { success: true, redirectTo };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}
