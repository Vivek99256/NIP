"use server";

import { requireVerifiedDoctor } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { radiologyReportCreateSchema } from "@/lib/validation/schemas";
import { sanitizeError } from "@/lib/errors/app-error";
import { revalidatePath } from "next/cache";

export async function createRadiologyReportAction(data: unknown) {
  try {
    const auth = await requireVerifiedDoctor();
    const validated = radiologyReportCreateSchema.parse(data);

    const report = await medicalRepo.createRadiologyReport({
      patientId: validated.patientId,
      category: validated.category,
      testDate: validated.testDate,
      reportDate: validated.reportDate,
      diagnosticCentre: validated.diagnosticCentre,
      radiologistName: validated.radiologistName,
      findings: validated.findings,
      clinicalNotes: validated.clinicalNotes,
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
