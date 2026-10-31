"use server";

import { requireAuth, requireVerifiedDoctor } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { laboratoryReportCreateSchema } from "@/lib/validation/schemas";
import { sanitizeError, AppError } from "@/lib/errors/app-error";
import { revalidatePath } from "next/cache";

export async function createLaboratoryReportAction(data: unknown) {
  try {
    const auth = await requireAuth();
    const validated = laboratoryReportCreateSchema.parse(data);

    // If patient is uploading, ensure they are uploading for themselves
    if (auth.user.role === "PATIENT" && auth.patientProfile?.id !== validated.patientId) {
      throw AppError.forbidden("Cannot upload reports to another patient's record");
    }

    if (auth.user.role === "DOCTOR") {
      await requireVerifiedDoctor(auth);
    }

    const report = await medicalRepo.createLaboratoryReport({
      patientId: validated.patientId,
      category: validated.category,
      testDate: validated.testDate,
      reportDate: validated.reportDate,
      laboratoryName: validated.laboratoryName,
      findings: validated.findings,
      doctorNotes: validated.doctorNotes || "",
      pdfFileId: validated.pdfFileId,
      results: (validated.results || []).map((r, i) => ({
        id: `res-${Date.now()}-${i}`,
        reportId: "",
        testName: r.testName,
        resultValue: r.resultValue,
        unit: r.unit,
        referenceRange: r.referenceRange || "",
        abnormalityFlag: r.abnormalityFlag,
      })),
      createdById: auth.user.id,
    });

    revalidatePath("/reports/laboratory");
    revalidatePath("/dashboard");
    revalidatePath("/doctor/reports");

    return { success: true, report };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}
