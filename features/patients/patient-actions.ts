"use server";

import { requireAuth } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { patientProfileUpdateSchema } from "@/lib/validation/schemas";
import { sanitizeError, AppError } from "@/lib/errors/app-error";
import { revalidatePath } from "next/cache";

export async function updatePatientProfileAction(patientId: string, data: unknown) {
  try {
    // 1. Authorize: Only this patient or permitted doctor can update
    const auth = await requireAuth();
    if (auth.user.role === "PATIENT" && auth.patientProfile?.id !== patientId) {
      throw AppError.forbidden("Cannot edit another patient's profile");
    }

    // 2. Validate input fields
    const validated = patientProfileUpdateSchema.parse(data);

    // 3. Update permitted profile fields only
    const updated = await medicalRepo.updatePatientProfile(patientId, {
      fullName: validated.fullName,
      dateOfBirth: validated.dateOfBirth || "",
      gender: validated.gender,
      bloodGroup: validated.bloodGroup,
      emergencyContactName: validated.emergencyContactName || "",
      emergencyContactPhone: validated.emergencyContactPhone || "",
      address: validated.address || "",
      allergies: validated.allergies || "",
      existingConditions: validated.existingConditions || "",
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return { success: true, profile: updated };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}
