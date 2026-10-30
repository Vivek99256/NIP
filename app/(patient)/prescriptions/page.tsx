import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrescriptionStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Pill, Printer, FileText, ArrowRight, Calendar, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function PrescriptionsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "PATIENT") redirect("/unauthorized");

  const patient = auth.patientProfile;
  if (!patient) redirect("/login");

  const prescriptions = await medicalRepo.getPrescriptions(patient.id);

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
                <Pill className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Prescriptions &amp; Medication
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Official medical prescriptions, dosage instructions, and treatment schedules issued by your physicians.
            </p>
          </div>
        </div>

        {prescriptions.length === 0 ? (
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-8">
              <EmptyState
                icon={Pill}
                title="No Prescriptions Issued"
                description="You do not have any electronic prescriptions on record yet. When your doctor issues a prescription, it will appear here."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prescriptions.map((rx) => (
              <Card key={rx.id} className="border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-900 block">{rx.prescriptionNumber}</span>
                      <span className="text-xs text-slate-500">{formatDate(rx.prescriptionDate)}</span>
                    </div>
                    <PrescriptionStatusBadge status={rx.status} />
                  </div>

                  <div className="p-5 space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px] uppercase font-semibold">Clinical Diagnosis</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{rx.diagnosis}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px] uppercase font-semibold mb-1">
                        Prescribed Medicines ({rx.medicines.length})
                      </span>
                      <div className="space-y-1.5">
                        {rx.medicines.slice(0, 3).map((m) => (
                          <div key={m.id} className="p-2 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{m.medicineName} ({m.strength})</span>
                            <span className="text-[11px] text-slate-500">{m.frequency}</span>
                          </div>
                        ))}
                        {rx.medicines.length > 3 && (
                          <span className="text-[11px] text-slate-400 italic block">
                            +{rx.medicines.length - 3} additional medication(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {rx.followUpDate && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded-md border border-indigo-100">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Recommended Follow-up: {formatDate(rx.followUpDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex justify-end">
                  <Link href={`/prescriptions/${rx.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full sm:w-auto">
                      <span>View &amp; Print Prescription</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
