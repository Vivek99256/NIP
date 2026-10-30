"use server";

import { requireVerifiedDoctor, requireAuth } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { prescriptionCreateSchema, prescriptionAmendSchema } from "@/lib/validation/schemas";
import { sanitizeError, AppError } from "@/lib/errors/app-error";
import { revalidatePath } from "next/cache";

export async function createPrescriptionDraftAction(data: unknown) {
  try {
    const auth = await requireVerifiedDoctor();
    const validated = prescriptionCreateSchema.parse(data);

    const prescription = await medicalRepo.createPrescription({
      patientId: validated.patientId,
      doctorId: auth.doctorProfile!.id,
      prescriptionDate: new Date().toISOString(),
      diagnosis: validated.diagnosis,
      clinicalNotes: validated.clinicalNotes,
      followUpDate: validated.followUpDate,
      status: "DRAFT",
      medicines: validated.medicines.map((m, i) => ({
        id: `med-${Date.now()}-${i}`,
        prescriptionId: "",
        medicineName: m.medicineName,
        strength: m.strength,
        dosage: m.dosage,
        route: m.route,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions || "",
        startDate: m.startDate,
        endDate: m.endDate,
      })),
    });

    revalidatePath("/doctor/prescriptions");
    revalidatePath("/prescriptions");

    return { success: true, prescription };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function finalizePrescriptionAction(prescriptionId: string) {
  try {
    const auth = await requireVerifiedDoctor();
    const rx = await medicalRepo.finalizePrescription(prescriptionId, auth.doctorProfile!.id);

    revalidatePath("/doctor/prescriptions");
    revalidatePath(`/doctor/prescriptions/${prescriptionId}`);
    revalidatePath("/prescriptions");
    revalidatePath(`/prescriptions/${prescriptionId}`);
    revalidatePath("/dashboard");

    return { success: true, prescription: rx };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function amendPrescriptionAction(prescriptionId: string, data: unknown) {
  try {
    const auth = await requireVerifiedDoctor();
    const validated = prescriptionAmendSchema.parse(data);

    const updatedMedicines = validated.medicines.map((m, i) => ({
      id: `med-amend-${Date.now()}-${i}`,
      prescriptionId,
      medicineName: m.medicineName,
      strength: m.strength,
      dosage: m.dosage,
      route: m.route,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions || "",
    }));

    const rx = await medicalRepo.amendPrescription(
      prescriptionId,
      auth.doctorProfile!.id,
      validated.reason,
      updatedMedicines,
      validated.clinicalNotes
    );

    revalidatePath("/doctor/prescriptions");
    revalidatePath(`/doctor/prescriptions/${prescriptionId}`);
    revalidatePath("/prescriptions");
    revalidatePath(`/prescriptions/${prescriptionId}`);

    return { success: true, prescription: rx };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}
