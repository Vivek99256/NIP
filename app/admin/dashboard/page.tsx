import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { DoctorStatusBadge } from "@/components/shared/status-badge";
import {
  Users,
  Stethoscope,
  Calendar,
  ShieldAlert,
  Activity,
  ArrowRight,
  CheckCircle,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { DoctorApprovalActions } from "@/components/admin/doctor-approval-actions";
import { AdminAnalyticsChart } from "@/components/admin/admin-analytics-chart";

export default async function AdminDashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "ADMIN") redirect("/unauthorized");

  const [patients, doctors, appointments, auditLogs] = await Promise.all([
    medicalRepo.getAllPatients(),
    medicalRepo.getAllDoctors(),
    medicalRepo.getAppointments(),
    medicalRepo.getAuditLogs(10),
  ]);

  const pendingDoctors = doctors.filter((d) => d.verificationStatus === "PENDING");
  const approvedDoctors = doctors.filter((d) => d.verificationStatus === "APPROVED");

  return (
    <AppShell
      userRole="ADMIN"
      userFullName="Platform Administrator"
      userIdentifier="ADMIN-ROOT"
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Activity className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Platform Administrative Control
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              System governance, doctor credential verification, operational audits, and security compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>Security Protocols Active</span>
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Registered Patients"
            value={patients.length}
            description="Verified mobile health profiles"
            icon={Users}
            colorScheme="sky"
          />
          <StatCard
            title="Active Physicians"
            value={approvedDoctors.length}
            description={`${pendingDoctors.length} pending verification`}
            icon={Stethoscope}
            colorScheme="teal"
          />
          <StatCard
            title="Consultation Slots"
            value={appointments.length}
            description="Total scheduled platform visits"
            icon={Calendar}
            colorScheme="emerald"
          />
          <StatCard
            title="Audit Security Logs"
            value={auditLogs.length}
            description="Recent monitored security events"
            icon={ShieldAlert}
            colorScheme="indigo"
          />
        </div>

        {/* Doctor Verification Queue */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span>Physician Verification Queue</span>
                {pendingDoctors.length > 0 && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {pendingDoctors.length} Action Required
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Review medical licenses and registration numbers before granting clinical prescribing rights.
              </CardDescription>
            </div>
            <Link href="/admin/doctors">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                <span>All Doctors</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingDoctors.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">Verification Queue Clear</p>
                <p>No physician applications are currently awaiting administrative review.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Physician Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Registration Number</TableHead>
                    <TableHead>Qualifications</TableHead>
                    <TableHead className="text-right">Verification Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDoctors.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-bold text-slate-900 text-xs">
                        {doc.professionalName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{doc.specialty}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-sky-800">
                        {doc.registrationNumber}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{doc.qualifications}</TableCell>
                      <TableCell className="text-right">
                        <DoctorApprovalActions doctorId={doc.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Analytics Chart & Security Audit Log Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recharts Analytics Component */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Platform Activity &amp; Consultations</CardTitle>
              <CardDescription className="text-xs">Weekly patient visits and diagnostic volumes</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <AdminAnalyticsChart />
            </CardContent>
          </Card>

          {/* Audit Logs Overview */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base">Recent Audit &amp; Security Events</CardTitle>
                <CardDescription className="text-xs">Real-time ledger of sensitive medical operations</CardDescription>
              </div>
              <Link href="/admin/audit-logs">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <span>Full Ledger</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 text-xs flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">{log.action}</span>
                      <span className="text-[11px] text-slate-500">
                        Entity: {log.entityType} ({log.entityId || "N/A"})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
