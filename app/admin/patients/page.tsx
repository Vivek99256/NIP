import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { AdminPatientManager } from "@/components/admin/admin-patient-manager";

export default async function AdminPatientsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "ADMIN") redirect("/unauthorized");

  const patients = await medicalRepo.getAllPatients();

  return (
    <AppShell
      userRole="ADMIN"
      userFullName="Platform Administrator"
      userIdentifier="ADMIN-ROOT"
      mobileNumber={auth.user.mobileNumber}
    >
      <AdminPatientManager initialPatients={patients} />
    </AppShell>
  );
}
