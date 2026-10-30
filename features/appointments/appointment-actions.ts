"use server";

import { requireAuth } from "@/lib/authorization/rbac";
import { medicalRepo } from "@/lib/db/repo";
import { appointmentBookingSchema } from "@/lib/validation/schemas";
import { sanitizeError, AppError } from "@/lib/errors/app-error";
import { revalidatePath } from "next/cache";

export async function bookAppointmentAction(data: unknown) {
  try {
    const auth = await requireAuth();
    if (auth.user.role !== "PATIENT" || !auth.patientProfile) {
      throw AppError.forbidden("Only registered patients may book appointments");
    }

    const validated = appointmentBookingSchema.parse(data);

    // Verify doctor exists and is approved
    const doctor = await medicalRepo.getDoctorProfileById(validated.doctorId);
    if (!doctor || doctor.verificationStatus !== "APPROVED") {
      throw AppError.badRequest("Selected doctor is not available for bookings");
    }

    // End time is 30 mins after start time
    const [startH, startM] = validated.startTime.split(":").map(Number);
    const endM = (startM + 30) % 60;
    const endH = startH + Math.floor((startM + 30) / 60);
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    const appointment = await medicalRepo.createAppointment({
      patientId: auth.patientProfile.id,
      doctorId: validated.doctorId,
      appointmentDate: new Date(validated.appointmentDate).toISOString(),
      startTime: validated.startTime,
      endTime,
      type: validated.type,
      reasonForVisit: validated.reasonForVisit,
      status: "CONFIRMED", // Auto-confirmed on slot validation success
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    revalidatePath("/doctor/appointments");
    revalidatePath("/doctor/dashboard");

    return { success: true, appointment };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}

export async function updateAppointmentStatusAction(appointmentId: string, status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED", reason?: string) {
  try {
    const auth = await requireAuth();
    const apt = await medicalRepo.getAppointmentById(appointmentId);
    if (!apt) throw AppError.notFound("Appointment not found");

    // Authorization check
    if (auth.user.role === "PATIENT") {
      if (apt.patientId !== auth.patientProfile?.id) {
        throw AppError.forbidden("Cannot modify another patient's appointment");
      }
      if (status !== "CANCELLED") {
        throw AppError.forbidden("Patients may only cancel eligible appointments");
      }
    } else if (auth.user.role === "DOCTOR") {
      if (apt.doctorId !== auth.doctorProfile?.id) {
        throw AppError.forbidden("Doctor can only update appointments assigned to them");
      }
    }

    const updated = await medicalRepo.updateAppointmentStatus(appointmentId, status, auth.user.id, reason);

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    revalidatePath("/doctor/appointments");
    revalidatePath("/doctor/dashboard");
    revalidatePath("/admin/appointments");

    return { success: true, appointment: updated };
  } catch (error) {
    const err = sanitizeError(error);
    return { success: false, error: err.message };
  }
}
