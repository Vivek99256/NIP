import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { BloodGroupBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, FileText, ArrowRight, Stethoscope } from "lucide-react";

export default async function DoctorPatientsPage() {
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

  // Doctor can only access patients they have treated or have appointments with
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Authorized Patient Directory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Per healthcare privacy policy, you only have clinical access to records for patients with an active consultation or prescription relationship.
              </p>
            </div>
          </div>
        </div>

        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardContent className="p-0">
            {authorizedPatients.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Users}
                  title="No Authorized Patients"
                  description="When patients schedule an appointment with you or receive a prescription, they will appear in your clinical directory."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Identifier</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Allergies Alert</TableHead>
                    <TableHead>Known Conditions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authorizedPatients.map((pat) => (
                    <TableRow key={pat.id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-800">
                        {pat.patientId}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-slate-900">
                        {pat.fullName}
                      </TableCell>
                      <TableCell>
                        <BloodGroupBadge bloodGroup={pat.bloodGroup} />
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-rose-700">
                        {pat.allergies || "None"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                        {pat.existingConditions || "None declared"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Link href={`/doctor/patients/${pat.id}`}>
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                            <span>Open Clinical Chart</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
