import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { DoctorReportsManager } from "@/components/doctor/doctor-reports-manager";

export default async function DoctorReportsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "DOCTOR") redirect("/unauthorized");

  const doctor = auth.doctorProfile;
  if (!doctor) redirect("/login");

  // Get patients with active clinical relationship
  const [appointments, prescriptions, allPatients] = await Promise.all([
    medicalRepo.getAppointments(undefined, doctor.id),
    medicalRepo.getPrescriptions(undefined, doctor.id),
    medicalRepo.getAllPatients(),
  ]);

  const authorizedPatientIds = Array.from(
    new Set([
      ...appointments.map((a) => a.patientId),
      ...prescriptions.map((rx) => rx.patientId),
    ])
  );

  const authorizedPatients = allPatients.filter((p) => authorizedPatientIds.includes(p.id));

  // Fetch reports for all authorized patients
  const radiologyPromises = authorizedPatientIds.map((pid) => medicalRepo.getRadiologyReports(pid));
  const labPromises = authorizedPatientIds.map((pid) => medicalRepo.getLaboratoryReports(pid));

  const allRadiology = (await Promise.all(radiologyPromises)).flat();
  const allLabs = (await Promise.all(labPromises)).flat();

  return (
    <AppShell
      userRole="DOCTOR"
      userFullName={doctor.professionalName}
      userIdentifier={doctor.registrationNumber}
      mobileNumber={auth.user.mobileNumber}
    >
      <DoctorReportsManager
        initialRadiology={allRadiology}
        initialLabs={allLabs}
        patients={authorizedPatients.length > 0 ? authorizedPatients : allPatients}
        doctorName={doctor.professionalName}
      />
    </AppShell>
  );
}
