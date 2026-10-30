"use server";

import { requireVerifiedDoctor } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { laboratoryReportCreateSchema } from "@/lib/validation/schemas";
import { sanitizeError } from "@/lib/errors/app-error";
import { revalidatePath } from "next/cache";

export async function createLaboratoryReportAction(data: unknown) {
  try {
    const auth = await requireVerifiedDoctor();
    const validated = laboratoryReportCreateSchema.parse(data);

    const report = await medicalRepo.createLaboratoryReport({
      patientId: validated.patientId,
      category: validated.category,
      testDate: validated.testDate,
      reportDate: validated.reportDate,
      laboratoryName: validated.laboratoryName,
      findings: validated.findings,
      doctorNotes: validated.doctorNotes,
      results: validated.results.map((r, i) => ({
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
