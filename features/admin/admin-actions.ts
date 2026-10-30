"use server";

import { requireAdmin } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { sanitizeError } from "@/lib/errors/app-error";
import { hashPassword } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";

// -----------------------------------------------------------------------------
// REPORT CATEGORIES CRUD
// -----------------------------------------------------------------------------

export async function createReportCategoryAction(formData: {
  type: "RADIOLOGY" | "LABORATORY";
  code: string;
  name: string;
  modalityOrSpecimen: string;
  typicalTurnaround: string;
  parametersCount: string;
  isActive?: boolean;
}) {
  try {
    await requireAdmin();
    const created = await medicalRepo.createReportCategory({
      type: formData.type,
      code: formData.code.trim().toUpperCase().replace(/\s+/g, "_"),
      name: formData.name.trim(),
      modalityOrSpecimen: formData.modalityOrSpecimen.trim(),
      typicalTurnaround: formData.typicalTurnaround.trim() || "2-4 hours",
      parametersCount: formData.parametersCount.trim() || "Standard",
      isActive: formData.isActive !== false,
    });

    revalidatePath("/admin/report-categories");
    return { success: true, category: created };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function updateReportCategoryAction(
  id: string,
  updates: {
    name?: string;
    modalityOrSpecimen?: string;
    typicalTurnaround?: string;
    parametersCount?: string;
    isActive?: boolean;
  }
) {
  try {
    await requireAdmin();
    const updated = await medicalRepo.updateReportCategory(id, updates);
    if (!updated) throw new Error("Category not found");

    revalidatePath("/admin/report-categories");
    return { success: true, category: updated };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function deleteReportCategoryAction(id: string) {
  try {
    await requireAdmin();
    const success = await medicalRepo.deleteReportCategory(id);
    if (!success) throw new Error("Failed to delete category");

    revalidatePath("/admin/report-categories");
    return { success: true };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function toggleReportCategoryStatusAction(id: string) {
  try {
    await requireAdmin();
    const updated = await medicalRepo.toggleReportCategoryStatus(id);
    if (!updated) throw new Error("Category not found");

    revalidatePath("/admin/report-categories");
    return { success: true, category: updated };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------------------------------
// DOCTOR MANAGEMENT CRUD
// -----------------------------------------------------------------------------

export async function updateDoctorVerificationAction(
  doctorId: string,
  status: "APPROVED" | "REJECTED" | "SUSPENDED"
) {
  try {
    const auth = await requireAdmin();
    const doc = await medicalRepo.updateDoctorVerification(doctorId, status, auth.user.id);

    revalidatePath("/admin/doctors");
    revalidatePath(`/admin/doctors/${doctorId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/doctor/dashboard");

    return { success: true, doctor: doc };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function adminCreateDoctorAction(formData: {
  fullName: string;
  mobileNumber: string;
  password?: string;
  specialty: string;
  qualifications: string;
  registrationNumber?: string;
  consultationFee: number;
  clinicAddress: string;
  clinicPhone?: string;
}) {
  try {
    await requireAdmin();
    const hashedPassword = hashPassword(formData.password || "Password123");
    const { user, profile } = await medicalRepo.createDoctorUser(
      formData.mobileNumber,
      formData.fullName,
      formData.specialty,
      formData.qualifications,
      hashedPassword
    );

    // Update custom fee & clinic address
    await medicalRepo.updateDoctorProfile(profile.id, {
      consultationFee: formData.consultationFee,
      clinicAddress: formData.clinicAddress,
      clinicPhone: formData.clinicPhone || formData.mobileNumber,
      registrationNumber: formData.registrationNumber || profile.registrationNumber,
    });

    revalidatePath("/admin/doctors");
    revalidatePath("/admin/dashboard");
    return { success: true, doctorId: profile.id };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function adminUpdateDoctorAction(
  doctorId: string,
  updates: {
    professionalName?: string;
    specialty?: string;
    qualifications?: string;
    consultationFee?: number;
    clinicAddress?: string;
    clinicPhone?: string;
  }
) {
  try {
    await requireAdmin();
    const updated = await medicalRepo.updateDoctorProfile(doctorId, updates);
    if (!updated) throw new Error("Doctor profile not found");

    revalidatePath("/admin/doctors");
    revalidatePath(`/admin/doctors/${doctorId}`);
    return { success: true, doctor: updated };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------------------------------
// PATIENT MANAGEMENT CRUD
// -----------------------------------------------------------------------------

export async function adminCreatePatientAction(formData: {
  fullName: string;
  mobileNumber: string;
  password?: string;
  bloodGroup?: any;
  gender?: any;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  allergies?: string;
  existingConditions?: string;
}) {
  try {
    await requireAdmin();
    const hashedPassword = hashPassword(formData.password || "Password123");
    const { user, profile } = await medicalRepo.createPatientUser(
      formData.mobileNumber,
      formData.fullName,
      hashedPassword
    );

    // Update additional profile info
    await medicalRepo.updatePatientProfile(profile.id, {
      bloodGroup: formData.bloodGroup || "UNKNOWN",
      gender: formData.gender || "NOT_DISCLOSED",
      dateOfBirth: formData.dateOfBirth || "",
      emergencyContactName: formData.emergencyContactName || "",
      emergencyContactPhone: formData.emergencyContactPhone || "",
      address: formData.address || "",
      allergies: formData.allergies || "",
      existingConditions: formData.existingConditions || "",
    });

    revalidatePath("/admin/patients");
    revalidatePath("/admin/dashboard");
    return { success: true, patientId: profile.id };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function adminTogglePatientStatusAction(patientId: string) {
  try {
    await requireAdmin();
    const updatedUser = await medicalRepo.togglePatientAccountStatus(patientId);
    if (!updatedUser) throw new Error("Patient not found");

    revalidatePath("/admin/patients");
    revalidatePath("/admin/dashboard");
    return { success: true, status: updatedUser.status };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------------------------------
// APPOINTMENTS CRUD (ADMIN)
// -----------------------------------------------------------------------------

export async function adminUpdateAppointmentStatusAction(
  appointmentId: string,
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED",
  cancellationReason?: string
) {
  try {
    const auth = await requireAdmin();
    const apt = await medicalRepo.updateAppointmentStatus(
      appointmentId,
      status,
      auth.user.id,
      cancellationReason
    );

    revalidatePath("/admin/appointments");
    revalidatePath("/admin/dashboard");
    return { success: true, appointment: apt };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}
