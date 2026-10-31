import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoctorStatusBadge, AppointmentStatusBadge, PrescriptionStatusBadge } from "@/components/shared/status-badge";
import {
  Calendar,
  Users,
  Pill,
  FileCheck2,
  Clock,
  Plus,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DoctorDashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "DOCTOR") redirect("/unauthorized");

  const doctor = auth.doctorProfile;
  if (!doctor) redirect("/login");

  const [appointments, prescriptions, allPatients] = await Promise.all([
    medicalRepo.getAppointments(undefined, doctor.id),
    medicalRepo.getPrescriptions(undefined, doctor.id),
    medicalRepo.getAllPatients(),
  ]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => {
    return new Date(a.appointmentDate).toISOString().split("T")[0] === todayStr;
  });

  // Authorized patients are patients with appointments or prescriptions
  const authorizedPatientIds = new Set([
    ...appointments.map((a) => a.patientId),
    ...prescriptions.map((rx) => rx.patientId),
  ]);
  const authorizedPatients = allPatients.filter((p) => authorizedPatientIds.has(p.id));

  return (
    <AppShell
      userRole="DOCTOR"
      userFullName={doctor.professionalName}
      userIdentifier={doctor.registrationNumber}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        {/* Verification Alert if doctor is not approved */}
        {doctor.verificationStatus !== "APPROVED" && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Account Verification Status: {doctor.verificationStatus}</p>
                <p className="text-amber-800">
                  Your medical credentials and registration number ({doctor.registrationNumber}) are pending administrative approval. Clinical actions are restricted until verified.
                </p>
              </div>
            </div>
            <DoctorStatusBadge status={doctor.verificationStatus} />
          </div>
        )}

        {/* Doctor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {doctor.professionalName}
                  </h1>
                  <DoctorStatusBadge status={doctor.verificationStatus} />
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {doctor.qualifications} • {doctor.specialty} • Reg: {doctor.registrationNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/doctor/prescriptions/new">
              <Button className="gap-2 shadow-sm bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4" />
                <span>Issue Prescription</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Hospital Patients"
            value={allPatients.length}
            description="Total registered profiles"
            icon={Users}
            colorScheme="teal"
          />
          <StatCard
            title="Authorized Patients"
            value={authorizedPatients.length > 0 ? authorizedPatients.length : allPatients.length}
            description="Active clinical care access"
            icon={Users}
            colorScheme="sky"
          />
          <StatCard
            title="Prescriptions Issued"
            value={prescriptions.length}
            description="Finalized &amp; active drafts"
            icon={Pill}
            colorScheme="indigo"
          />
          <StatCard
            title="Clinical Practice"
            value={doctor.specialty}
            description={doctor.qualifications}
            icon={Stethoscope}
            colorScheme="emerald"
          />
        </div>

        {/* Clinical Operations & Patient Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clinical Quick Actions */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Clinical Management</CardTitle>
              <CardDescription className="text-xs">Quick shortcuts to medical operations &amp; prescribing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/doctor/prescriptions/new" className="block">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-teal-50/50 hover:border-teal-200 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Write e-Prescription</span>
                      <span className="text-[11px] text-slate-500">Prescribe medications and dosage schedules</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>

              <Link href="/doctor/reports" className="block">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-sky-50/50 hover:border-sky-200 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 text-sky-800 rounded-lg">
                      <FileCheck2 className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Review Clinical Reports</span>
                      <span className="text-[11px] text-slate-500">Examine patient radiology scans and lab tests</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>

              <Link href="/doctor/patients" className="block">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Patient Directory</span>
                      <span className="text-[11px] text-slate-500">Access comprehensive electronic medical records</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Authorized Patients List */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Authorized Patients</CardTitle>
                <CardDescription className="text-xs">Patients with established doctor-patient clinical access</CardDescription>
              </div>
              <Link href="/doctor/patients">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <span>Directory</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {authorizedPatients.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No patients authorized yet.</p>
              ) : (
                <div className="space-y-3">
                  {authorizedPatients.map((pat) => (
                    <div
                      key={pat.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                          {pat.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{pat.fullName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {pat.patientId} • Blood: {pat.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")}
                          </p>
                        </div>
                      </div>
                      <Link href={`/doctor/patients/${pat.id}`}>
                        <Button size="sm" variant="outline" className="text-xs h-8">
                          View History
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
