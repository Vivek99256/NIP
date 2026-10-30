import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { RadiologyReportList } from "@/components/reports/radiology-report-list";
import { FileScan, Search } from "lucide-react";

interface Props {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function RadiologyReportsPage(props: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "PATIENT") redirect("/unauthorized");

  const patient = auth.patientProfile;
  if (!patient) redirect("/login");

  const params = await props.searchParams;
  const reports = await medicalRepo.getRadiologyReports(patient.id, {
    category: params.category,
    search: params.q,
  });

  return (
    <AppShell
      userRole="PATIENT"
      userFullName={patient.fullName}
      userIdentifier={patient.patientId}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <FileScan className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Radiology &amp; Imaging Reports
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Diagnostic X-Ray, CT scans, MRI imaging, and ultrasound reports issued to your record.
            </p>
          </div>
        </div>

        {/* Client Interactive Filter & List Component */}
        <RadiologyReportList reports={reports} selectedCategory={params.category || "ALL"} />
      </div>
    </AppShell>
  );
}
