"use server";

import { requireVerifiedDoctor, requireDoctorPatientRelationship } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { sanitizeError } from "@/lib/errors/app-error";
import { revalidatePath } from "next/cache";

export async function doctorCreateRadiologyReportAction(formData: {
  patientId: string;
  category: any;
  testDate: string;
  reportDate?: string;
  diagnosticCentre: string;
  radiologistName: string;
  findings: string;
  clinicalNotes?: string;
  pdfFileId?: string;
}) {
  try {
    const auth = await requireVerifiedDoctor();
    await requireDoctorPatientRelationship(auth, formData.patientId);

    const report = await medicalRepo.createRadiologyReport({
      patientId: formData.patientId,
      category: formData.category,
      testDate: formData.testDate,
      reportDate: formData.reportDate || new Date().toISOString(),
      diagnosticCentre: formData.diagnosticCentre,
      radiologistName: formData.radiologistName || auth.doctorProfile?.professionalName || "Verified Physician",
      findings: formData.findings,
      clinicalNotes: formData.clinicalNotes,
      pdfFileId: formData.pdfFileId,
      createdById: auth.user.id,
    });

    revalidatePath("/doctor/reports");
    revalidatePath(`/doctor/patients/${formData.patientId}`);
    revalidatePath("/reports/radiology");
    return { success: true, report };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function doctorCreateLaboratoryReportAction(formData: {
  patientId: string;
  category: any;
  testDate: string;
  reportDate?: string;
  laboratoryName: string;
  findings: string;
  doctorNotes?: string;
  pdfFileId?: string;
  results: Array<{
    testName: string;
    resultValue: string;
    unit: string;
    referenceRange: string;
    abnormalityFlag: "NORMAL" | "LOW" | "HIGH" | "CRITICAL" | "ABNORMAL";
  }>;
}) {
  try {
    const auth = await requireVerifiedDoctor();
    await requireDoctorPatientRelationship(auth, formData.patientId);

    const reportId = `lab-rep-${Date.now()}`;
    const resultsWithId = formData.results.map((r, idx) => ({
      ...r,
      id: `lab-res-${Date.now()}-${idx}`,
      reportId,
    }));

    const report = await medicalRepo.createLaboratoryReport({
      patientId: formData.patientId,
      category: formData.category,
      testDate: formData.testDate,
      reportDate: formData.reportDate || new Date().toISOString(),
      laboratoryName: formData.laboratoryName,
      findings: formData.findings,
      doctorNotes: formData.doctorNotes,
      pdfFileId: formData.pdfFileId,
      results: resultsWithId,
      createdById: auth.user.id,
    });

    revalidatePath("/doctor/reports");
    revalidatePath(`/doctor/patients/${formData.patientId}`);
    revalidatePath("/reports/laboratory");
    return { success: true, report };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}
