import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentsManager } from "@/components/documents/documents-manager";
import { FolderOpen } from "lucide-react";

export default async function MedicalDocumentsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "PATIENT") redirect("/unauthorized");

  const patient = auth.patientProfile;
  if (!patient) redirect("/login");

  const documents = await medicalRepo.getMedicalDocuments(patient.id);

  return (
    <AppShell
      userRole="PATIENT"
      userFullName={patient.fullName}
      userIdentifier={patient.patientId}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FolderOpen className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Medical Records &amp; Certificates
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Discharge summaries, referral notes, operative summaries, and official health certificates.
            </p>
          </div>
        </div>

        <DocumentsManager patientId={patient.id} initialDocuments={documents} />
      </div>
    </AppShell>
  );
}
