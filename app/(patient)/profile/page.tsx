import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { calculateProfileCompletion } from "@/features/patients/patient-utils";
import { PatientProfileForm } from "@/components/profile/patient-profile-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { User, ShieldCheck, CheckCircle2 } from "lucide-react";

export default async function PatientProfilePage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "PATIENT") redirect("/unauthorized");

  const patient = auth.patientProfile;
  if (!patient) redirect("/login");

  const completion = calculateProfileCompletion(patient);

  return (
    <AppShell
      userRole="PATIENT"
      userFullName={patient.fullName}
      userIdentifier={patient.patientId}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Personal &amp; Medical Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Maintain your official health record details, emergency contacts, and vital medical alerts.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
            <User className="h-4 w-4 text-sky-600" />
            <span>{patient.patientId}</span>
          </div>
        </div>

        {/* Completion Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-700">Health Profile Completion</span>
            <span className="text-sky-700">{completion.percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-sky-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
          {completion.missingFields.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-2">
              For optimal clinical emergency readiness, complete: {completion.missingFields.join(", ")}
            </p>
          )}
        </div>

        {/* Interactive Client Form */}
        <PatientProfileForm
          patient={patient}
          verifiedMobile={auth.user.mobileNumber}
        />
      </div>
    </AppShell>
  );
}
