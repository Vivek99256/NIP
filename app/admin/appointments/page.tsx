import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { AdminAppointmentsManager } from "@/components/admin/admin-appointments-manager";

export default async function AdminAppointmentsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "ADMIN") redirect("/unauthorized");

  const [appointments, patients, doctors] = await Promise.all([
    medicalRepo.getAppointments(),
    medicalRepo.getAllPatients(),
    medicalRepo.getAllDoctors(),
  ]);

  return (
    <AppShell
      userRole="ADMIN"
      userFullName="Platform Administrator"
      userIdentifier="ADMIN-ROOT"
      mobileNumber={auth.user.mobileNumber}
    >
      <AdminAppointmentsManager
        initialAppointments={appointments}
        patients={patients}
        doctors={doctors}
      />
    </AppShell>
  );
}
