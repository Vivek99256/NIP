import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { PrescriptionBuilderForm } from "@/components/prescriptions/prescription-builder-form";
import { ArrowLeft, Pill, ShieldAlert } from "lucide-react";

interface Props {
  searchParams: Promise<{ patientId?: string }>;
}

export default async function NewPrescriptionPage(props: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "DOCTOR") redirect("/unauthorized");

  const doctor = auth.doctorProfile;
  if (!doctor) redirect("/login");

  if (doctor.verificationStatus !== "APPROVED") {
    redirect("/doctor/dashboard");
  }

  const { patientId } = await props.searchParams;
  const allPatients = await medicalRepo.getAllPatients();

  return (
    <AppShell
      userRole="DOCTOR"
      userFullName={doctor.professionalName}
      userIdentifier={doctor.registrationNumber}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/doctor/prescriptions">
            <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Prescriptions</span>
            </button>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Write Clinical Prescription
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue verified medication orders with full dosage schedules, route of administration, and instructions.
              </p>
            </div>
          </div>
        </div>

        <PrescriptionBuilderForm
          patients={allPatients}
          defaultPatientId={patientId}
          doctorName={doctor.professionalName}
          registrationNumber={doctor.registrationNumber}
        />
      </div>
    </AppShell>
  );
}
