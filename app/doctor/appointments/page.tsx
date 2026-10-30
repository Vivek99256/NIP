import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { DoctorAppointmentManager } from "@/components/doctor/doctor-appointment-manager";
import { Calendar } from "lucide-react";

export default async function DoctorAppointmentsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "DOCTOR") redirect("/unauthorized");

  const doctor = auth.doctorProfile;
  if (!doctor) redirect("/login");

  const [appointments, patients] = await Promise.all([
    medicalRepo.getAppointments(undefined, doctor.id),
    medicalRepo.getAllPatients(),
  ]);

  const patientMap = new Map(patients.map((p) => [p.id, p]));

  const enrichedAppointments = appointments.map((apt) => ({
    ...apt,
    patientName: patientMap.get(apt.patientId)?.fullName || "Unknown Patient",
    patientCode: patientMap.get(apt.patientId)?.patientId || "PAT-UNKNOWN",
  }));

  return (
    <AppShell
      userRole="DOCTOR"
      userFullName={doctor.professionalName}
      userIdentifier={doctor.registrationNumber}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Assigned Clinical Appointments
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your consultation schedule and update appointment status (Confirm, Complete, or Cancel).
              </p>
            </div>
          </div>
        </div>

        <DoctorAppointmentManager initialAppointments={enrichedAppointments} />
      </div>
    </AppShell>
  );
}
