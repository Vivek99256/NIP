"use server";

import { requireAuth, requireVerifiedDoctor } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { radiologyReportCreateSchema } from "@/lib/validation/schemas";
import { sanitizeError, AppError } from "@/lib/errors/app-error";
import { revalidatePath } from "next/cache";

export async function createRadiologyReportAction(data: unknown) {
  try {
    const auth = await requireAuth();
    const validated = radiologyReportCreateSchema.parse(data);

    // If patient is uploading, ensure they are uploading for themselves
    if (auth.user.role === "PATIENT" && auth.patientProfile?.id !== validated.patientId) {
      throw AppError.forbidden("Cannot upload reports to another patient's record");
    }

    if (auth.user.role === "DOCTOR") {
      await requireVerifiedDoctor(auth);
    }

    const report = await medicalRepo.createRadiologyReport({
      patientId: validated.patientId,
      category: validated.category,
      testDate: validated.testDate,
      reportDate: validated.reportDate,
      diagnosticCentre: validated.diagnosticCentre,
      radiologistName: validated.radiologistName,
      findings: validated.findings,
      clinicalNotes: validated.clinicalNotes || "",
      pdfFileId: validated.pdfFileId,
      createdById: auth.user.id,
    });

    revalidatePath("/reports/radiology");
    revalidatePath("/dashboard");
    revalidatePath("/doctor/reports");

    return { success: true, report };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}
