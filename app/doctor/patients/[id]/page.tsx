import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { requireDoctorPatientRelationship } from "@/lib/authorization/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BloodGroupBadge, PrescriptionStatusBadge, AbnormalityFlagBadge } from "@/components/shared/status-badge";
import {
  ArrowLeft,
  Pill,
  FileScan,
  FlaskConical,
  Plus,
  AlertTriangle,
  User,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DoctorPatientDetailPage(props: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "DOCTOR") redirect("/unauthorized");

  const { id } = await props.params;

  // Enforce doctor-patient relationship authorization
  try {
    await requireDoctorPatientRelationship(auth, id);
  } catch (err: unknown) {
    redirect("/unauthorized");
  }

  const [patient, radiology, labs, prescriptions] = await Promise.all([
    medicalRepo.getPatientProfileById(id),
    medicalRepo.getRadiologyReports(id),
    medicalRepo.getLaboratoryReports(id),
    medicalRepo.getPrescriptions(id),
  ]);

  if (!patient) notFound();

  return (
    <AppShell
      userRole="DOCTOR"
      userFullName={auth.doctorProfile?.professionalName}
      userIdentifier={auth.doctorProfile?.registrationNumber}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/doctor/patients">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Authorized Patients</span>
            </Button>
          </Link>

          <Link href={`/doctor/prescriptions/new?patientId=${patient.id}`}>
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-xs">
              <Plus className="h-4 w-4" />
              <span>Issue New Prescription</span>
            </Button>
          </Link>
        </div>

        {/* Patient Identity & Critical Alert Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {patient.fullName}
                </h1>
                <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                  {patient.patientId}
                </span>
                <BloodGroupBadge bloodGroup={patient.bloodGroup} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gender: {patient.gender} • Emergency Contact: {patient.emergencyContactName || "N/A"} ({patient.emergencyContactPhone || "N/A"})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                  <span>Allergies</span>
                </span>
                <p className="font-semibold text-rose-800 mt-0.5">{patient.allergies || "No allergies documented"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Conditions */}
        {patient.existingConditions && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-0.5 uppercase tracking-wider text-[11px]">
              Documented Medical History &amp; Chronic Conditions:
            </span>
            <p className="text-slate-800 leading-relaxed">{patient.existingConditions}</p>
          </div>
        )}

        {/* Clinical History Tabs / Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prescriptions Section */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-indigo-600" />
                  <span>Prescription History</span>
                </span>
                <Badge variant="outline">{prescriptions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {prescriptions.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No prescriptions issued.</p>
              ) : (
                prescriptions.map((rx) => (
                  <div key={rx.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{rx.prescriptionNumber}</span>
                      <PrescriptionStatusBadge status={rx.status} />
                    </div>
                    <p className="font-semibold text-slate-900">{rx.diagnosis}</p>
                    <p className="text-[11px] text-slate-500">{rx.medicines.length} medicine(s)</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Laboratory Reports */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-teal-600" />
                  <span>Pathology &amp; Labs</span>
                </span>
                <Badge variant="outline">{labs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {labs.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No lab records.</p>
              ) : (
                labs.map((l) => (
                  <div key={l.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <Badge variant="teal" className="text-[10px]">{l.category}</Badge>
                      <span className="text-[11px] text-slate-400 font-mono">{formatDate(l.reportDate)}</span>
                    </div>
                    <p className="text-slate-800 text-[11px]">{l.findings}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {l.results.slice(0, 3).map((r) => (
                        <span key={r.id} className="text-[10px] bg-white border px-1.5 py-0.5 rounded font-mono">
                          {r.testName}: {r.resultValue} {r.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Radiology Imaging */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileScan className="h-4 w-4 text-sky-600" />
                  <span>Radiology &amp; Scans</span>
                </span>
                <Badge variant="outline">{radiology.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {radiology.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No imaging records.</p>
              ) : (
                radiology.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="text-[10px]">{r.category}</Badge>
                      <span className="text-[11px] text-slate-400 font-mono">{formatDate(r.reportDate)}</span>
                    </div>
                    <p className="text-slate-800 text-[11px] line-clamp-2">{r.findings}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
