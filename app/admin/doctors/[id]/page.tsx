import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoctorStatusBadge } from "@/components/shared/status-badge";
import { ArrowLeft, Stethoscope, ShieldCheck, Building2, Phone, Award } from "lucide-react";
import { DoctorApprovalActions } from "@/components/admin/doctor-approval-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminDoctorDetailPage(props: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "ADMIN") redirect("/unauthorized");

  const { id } = await props.params;
  const doctor = await medicalRepo.getDoctorProfileById(id);

  if (!doctor) notFound();

  return (
    <AppShell
      userRole="ADMIN"
      userFullName="Platform Administrator"
      userIdentifier="ADMIN-ROOT"
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/doctors">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Doctors Directory</span>
            </Button>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {doctor.professionalName}
              </h1>
              <DoctorStatusBadge status={doctor.verificationStatus} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Medical Registration Number: <strong>{doctor.registrationNumber}</strong>
            </p>
          </div>

          <DoctorApprovalActions doctorId={doctor.id} />
        </div>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-teal-600" />
              <span>Credentials &amp; Practice Details</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Audited medical practitioner record on platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-500 block">Medical Specialty:</span>
                <span className="font-bold text-slate-900 text-sm">{doctor.specialty}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Academic Degrees &amp; Qualifications:</span>
                <span className="font-bold text-slate-900 text-sm">{doctor.qualifications}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Consultation Fee:</span>
                <span className="font-bold text-slate-900 text-sm">₹{doctor.consultationFee}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Clinic Contact Phone:</span>
                <span className="font-mono text-slate-900 font-semibold">{doctor.clinicPhone || "N/A"}</span>
              </div>
            </div>

            {doctor.clinicAddress && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="font-bold text-slate-700 block mb-1">Clinic Address:</span>
                <p className="text-slate-800 leading-relaxed">{doctor.clinicAddress}</p>
              </div>
            )}

            {doctor.bio && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="font-bold text-slate-700 block mb-1">Professional Bio:</span>
                <p className="text-slate-700 leading-relaxed">{doctor.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
