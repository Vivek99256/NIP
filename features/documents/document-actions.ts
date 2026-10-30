"use server";

import { requireAuth } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { medicalDocumentCreateSchema } from "@/lib/validation/schemas";
import { sanitizeError, AppError } from "@/lib/errors/app-error";
import { revalidatePath } from "next/cache";

export async function createMedicalDocumentAction(data: unknown) {
  try {
    const auth = await requireAuth();
    const validated = medicalDocumentCreateSchema.parse(data);

    // If patient is creating, ensure they are uploading for themselves
    if (auth.user.role === "PATIENT" && auth.patientProfile?.id !== validated.patientId) {
      throw AppError.forbidden("Cannot upload documents to another patient's record");
    }

    const doc = await medicalRepo.createMedicalDocument({
      patientId: validated.patientId,
      title: validated.title,
      category: validated.category,
      documentDate: new Date(validated.documentDate).toISOString(),
      description: validated.description || "",
      fileId: validated.fileId,
      createdById: auth.user.id,
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");

    return { success: true, document: doc };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}
