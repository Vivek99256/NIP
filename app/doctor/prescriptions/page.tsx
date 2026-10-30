import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { PrescriptionStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Pill, Plus, ArrowRight, Eye, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FinalizePrescriptionButton } from "@/components/prescriptions/finalize-prescription-button";

export default async function DoctorPrescriptionsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "DOCTOR") redirect("/unauthorized");

  const doctor = auth.doctorProfile;
  if (!doctor) redirect("/login");

  const [prescriptions, patients] = await Promise.all([
    medicalRepo.getPrescriptions(undefined, doctor.id),
    medicalRepo.getAllPatients(),
  ]);

  const patientMap = new Map(patients.map((p) => [p.id, p]));

  return (
    <AppShell
      userRole="DOCTOR"
      userFullName={doctor.professionalName}
      userIdentifier={doctor.registrationNumber}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Pill className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Prescription Management
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Create, review, and finalize medical prescriptions. Finalized prescriptions require an official amendment to change.
            </p>
          </div>

          <Link href="/doctor/prescriptions/new">
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Write New Prescription</span>
            </Button>
          </Link>
        </div>

        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardContent className="p-0">
            {prescriptions.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Pill}
                  title="No Prescriptions Issued Yet"
                  description="Start a new clinical prescription for an authorized patient."
                  actionLabel="Create First Prescription"
                  actionHref="/doctor/prescriptions/new"
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prescription No.</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Medicines</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((rx) => {
                    const pat = patientMap.get(rx.patientId);
                    return (
                      <TableRow key={rx.id}>
                        <TableCell className="font-mono text-xs font-bold text-slate-900">
                          {rx.prescriptionNumber}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-xs text-slate-800 block">
                            {pat?.fullName || "Patient"}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {pat?.patientId}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">
                          {formatDate(rx.prescriptionDate)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                          {rx.diagnosis}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-semibold text-slate-800">
                            {rx.medicines.length} medicine(s)
                          </span>
                        </TableCell>
                        <TableCell>
                          <PrescriptionStatusBadge status={rx.status} />
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {rx.status === "DRAFT" && (
                            <FinalizePrescriptionButton prescriptionId={rx.id} />
                          )}
                          <Link href={`/prescriptions/${rx.id}`}>
                            <Button size="sm" variant="outline" className="h-8 text-xs">
                              View Sheet
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
