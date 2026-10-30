import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { AppointmentBookingForm } from "@/components/appointments/appointment-booking-form";
import { ArrowLeft, Calendar } from "lucide-react";

export default async function BookAppointmentPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "PATIENT") redirect("/unauthorized");

  const patient = auth.patientProfile;
  if (!patient) redirect("/login");

  // Only approved doctors can take appointments
  const allDoctors = await medicalRepo.getAllDoctors();
  const approvedDoctors = allDoctors.filter((d) => d.verificationStatus === "APPROVED");

  return (
    <AppShell
      userRole="PATIENT"
      userFullName={patient.fullName}
      userIdentifier={patient.patientId}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/appointments">
            <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Appointments</span>
            </button>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Schedule a Consultation
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your specialist physician, preferred consultation date, and available clinic time slot.
              </p>
            </div>
          </div>
        </div>

        <AppointmentBookingForm doctors={approvedDoctors} />
      </div>
    </AppShell>
  );
}
