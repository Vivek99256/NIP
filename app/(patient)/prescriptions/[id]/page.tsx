import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { requirePatientOwnership } from "@/lib/authorization/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { PrescriptionStatusBadge, BloodGroupBadge } from "@/components/shared/status-badge";
import { ArrowLeft, Printer, Pill, History, AlertCircle, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/prescriptions/print-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrescriptionDetailPage(props: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const { id } = await props.params;
  const rx = await medicalRepo.getPrescriptionById(id);

  if (!rx) {
    notFound();
  }

  // Enforce patient ownership authorization
  try {
    await requirePatientOwnership(rx.patientId);
  } catch {
    redirect("/unauthorized");
  }

  const [patient, doctor] = await Promise.all([
    medicalRepo.getPatientProfileById(rx.patientId),
    medicalRepo.getDoctorProfileById(rx.doctorId),
  ]);

  return (
    <AppShell
      userRole={auth.user.role}
      userFullName={auth.patientProfile?.fullName || auth.doctorProfile?.professionalName}
      userIdentifier={auth.patientProfile?.patientId || auth.doctorProfile?.registrationNumber}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="max-w-4xl mx-auto space-y-6 print:max-w-none print:w-full print:m-0 print:space-y-0">
        <div className="flex items-center justify-between no-print">
          <Link href="/prescriptions">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Prescriptions</span>
            </Button>
          </Link>

          <PrintButton />
        </div>

        {/* Printable Official Medical Prescription Card */}
        <Card className="border-slate-300 shadow-md bg-white overflow-hidden printable-card">
          {/* Clinic & Doctor Letterhead Header */}
          <div className="p-8 border-b-2 border-slate-900 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950 uppercase tracking-tight">
                  {doctor?.professionalName || "Attending Physician"}
                </h2>
                <p className="text-xs font-semibold text-slate-700">{doctor?.qualifications}</p>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  Reg No: {doctor?.registrationNumber} • {doctor?.specialty}
                </p>
                {doctor?.clinicAddress && (
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm">{doctor.clinicAddress}</p>
                )}
              </div>

              <div className="text-right">
                <span className="text-3xl font-extrabold text-sky-700 font-serif block">℞</span>
                <span className="font-mono font-bold text-sm text-slate-900 block mt-1">
                  {rx.prescriptionNumber}
                </span>
                <span className="text-xs text-slate-500 block">Date: {formatDate(rx.prescriptionDate)}</span>
                <div className="mt-1">
                  <PrescriptionStatusBadge status={rx.status} />
                </div>
              </div>
            </div>

            {/* Patient Header Details Box */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Patient Name:</span>
                <span className="font-bold text-slate-900 text-sm">{patient?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Patient ID:</span>
                <span className="font-mono font-semibold text-slate-800">{patient?.patientId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Blood Group:</span>
                <span className="font-semibold text-slate-800">
                  {patient ? <BloodGroupBadge bloodGroup={patient.bloodGroup} /> : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Known Allergies:</span>
                <span className="font-bold text-rose-700">{patient?.allergies || "None"}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-8 space-y-6">
            {/* Clinical Diagnosis */}
            <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 block mb-1">
                Clinical Diagnosis
              </span>
              <p className="text-base font-bold text-slate-900">{rx.diagnosis}</p>
            </div>

            {/* Prescribed Medicines Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-2">
                Medication &amp; Dosage Instructions
              </h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Medicine &amp; Strength</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Special Instructions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rx.medicines.map((m, index) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs text-slate-400">{index + 1}</TableCell>
                        <TableCell className="font-bold text-slate-900 text-xs">
                          {m.medicineName} <span className="text-sky-700 font-semibold">({m.strength})</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">{m.dosage}</TableCell>
                        <TableCell className="text-xs text-slate-600">{m.route}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800">{m.frequency}</TableCell>
                        <TableCell className="text-xs text-slate-700">{m.duration}</TableCell>
                        <TableCell className="text-xs text-slate-600 italic">
                          {m.instructions || "As directed"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Clinical Advice / Remarks */}
            {rx.clinicalNotes && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Doctor&apos;s Advice &amp; Lifestyle Precautions
                </h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {rx.clinicalNotes}
                </div>
              </div>
            )}

            {/* Follow-up Date */}
            {rx.followUpDate && (
              <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/70 text-xs text-indigo-900 flex items-center justify-between">
                <span className="font-semibold">Recommended Clinical Follow-up:</span>
                <span className="font-bold font-mono text-sm">{formatDate(rx.followUpDate)}</span>
              </div>
            )}

            {/* Amendment & Version History */}
            {rx.revisions.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Version History &amp; Official Amendments ({rx.revisions.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {rx.revisions.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs">
                      <div className="flex items-center justify-between font-semibold text-amber-900 mb-1">
                        <span>Amendment #{rev.revisionNumber}</span>
                        <span className="font-mono text-[11px] text-amber-700">{formatDate(rev.createdAt)}</span>
                      </div>
                      <p className="text-amber-800">
                        <strong>Reason:</strong> {rev.reasonForAmendment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature & Disclaimer Block */}
            <div className="pt-12 mt-8 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between text-xs text-slate-500 gap-6">
              <div className="space-y-1 text-[11px]">
                <p>Generated via MedRec Electronic Prescription Infrastructure</p>
                <p>This is a tamper-evident digital prescription verified by registered practitioner</p>
              </div>

              <div className="text-center sm:text-right border-t border-slate-300 pt-3 min-w-[200px]">
                <p className="font-bold text-slate-900">{doctor?.professionalName}</p>
                <p className="text-[11px] text-slate-500">{doctor?.registrationNumber}</p>
                <p className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1 mt-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Finalized &amp; Signed</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
