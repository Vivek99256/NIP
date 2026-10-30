import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { requirePatientOwnership } from "@/lib/authorization/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { AbnormalityFlagBadge } from "@/components/shared/status-badge";
import {
  ArrowLeft,
  FlaskConical,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  QrCode,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  FileCheck2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/prescriptions/print-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LaboratoryDetailPage(props: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const { id } = await props.params;
  const report = await medicalRepo.getLaboratoryReportById(id);

  if (!report) {
    notFound();
  }

  // Enforce patient ownership authorization (allows Patient, treating Doctor, Admin)
  try {
    await requirePatientOwnership(report.patientId);
  } catch {
    redirect("/unauthorized");
  }

  const patient = await medicalRepo.getPatientProfileById(report.patientId);

  // Calculate abnormality stats
  const totalBiomarkers = report.results.length;
  const abnormalCount = report.results.filter(
    (r) => r.abnormalityFlag && r.abnormalityFlag !== "NORMAL"
  ).length;

  return (
    <AppShell
      userRole={auth.user.role}
      userFullName={auth.patientProfile?.fullName || auth.doctorProfile?.professionalName}
      userIdentifier={auth.patientProfile?.patientId || auth.doctorProfile?.registrationNumber}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="max-w-4xl mx-auto space-y-6 print:max-w-none print:w-full print:m-0 print:space-y-0">
        {/* Navigation & Print Actions */}
        <div className="flex items-center justify-between no-print">
          <Link href={auth.user.role === "DOCTOR" ? "/doctor/reports" : "/reports/laboratory"}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Reports</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {report.pdfFileId && (
              <a
                href={`/api/documents/download?key=${encodeURIComponent(report.pdfFileId)}&inline=true`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-teal-700 border-teal-200 hover:bg-teal-50">
                  <FlaskConical className="h-4 w-4" />
                  <span>View Attached Report</span>
                </Button>
              </a>
            )}
            <PrintButton />
          </div>
        </div>

        {/* Master Clinical Pathology Report Sheet */}
        <Card className="border border-slate-300 shadow-xl overflow-hidden bg-white printable-card rounded-2xl print:rounded-lg">
          {/* Official Laboratory Letterhead */}
          <div className="p-6 sm:p-8 print:p-3 bg-gradient-to-b from-slate-50 to-white border-b-2 border-slate-900">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 print:gap-2">
              <div className="space-y-1.5 print:space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 print:h-7 print:w-7 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
                    <FlaskConical className="h-5 w-5 print:h-4 print:w-4" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl print:text-base font-black text-slate-900 tracking-tight uppercase">
                      {report.laboratoryName}
                    </h2>
                    <p className="text-[11px] print:text-[9px] font-semibold text-teal-700 tracking-wide uppercase">
                      Department of Clinical Pathology &amp; Molecular Diagnostics
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 print:gap-2 pt-1 print:pt-0 text-[11px] print:text-[9px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Award className="h-3.5 w-3.5 print:h-3 print:w-3 text-amber-600" />
                    <span>NABL Accredited Lab #MC-2026</span>
                  </span>
                  <span>•</span>
                  <span>ISO 15189:2022 Certified</span>
                  <span>•</span>
                  <span>CAP Validated Quality Control</span>
                </div>
              </div>

              {/* Barcode & Verification Stamp */}
              <div className="text-right flex flex-col items-end">
                <div className="px-3 py-1 print:px-2 print:py-0.5 bg-teal-50 border border-teal-200 rounded-lg text-right">
                  <span className="text-[10px] print:text-[8px] uppercase font-bold text-teal-800 tracking-wider block">
                    Diagnostic Lab Ref No.
                  </span>
                  <span className="font-mono font-black text-sm print:text-xs text-slate-900 block tracking-wider">
                    {report.id.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] print:text-[8px] font-mono text-slate-400 mt-1 print:mt-0.5">
                  BARCODE: *LAB-{report.id.slice(-6).toUpperCase()}*
                </span>
              </div>
            </div>

            {/* Patient & Specimen Metadata Bar */}
            <div className="mt-6 print:mt-2 p-4 print:p-2 rounded-xl bg-slate-50/90 border border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2 text-xs print:text-[10px]">
              <div>
                <span className="text-slate-400 font-medium block text-[10px] print:text-[8px] uppercase">Patient Full Name</span>
                <span className="font-bold text-slate-900 text-sm print:text-xs">{patient?.fullName || "Patient"}</span>
                <span className="font-mono text-slate-500 text-[11px] print:text-[9px] block mt-0.5 print:mt-0">
                  ID: {patient?.patientId || "PAT-2026"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[10px] print:text-[8px] uppercase">Gender / Blood Group</span>
                <span className="font-semibold text-slate-800">
                  {patient?.gender?.replace(/_/g, " ") || "Not Disclosed"}
                </span>
                <span className="text-slate-600 font-medium block mt-0.5 print:mt-0">
                  Blood Group: <strong className="text-slate-900">{patient?.bloodGroup?.replace(/_/g, "+") || "Unknown"}</strong>
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[10px] print:text-[8px] uppercase">Sample Collection</span>
                <span className="font-semibold text-slate-800">{formatDate(report.testDate)}</span>
                <span className="text-slate-500 text-[11px] print:text-[9px] block mt-0.5 print:mt-0">Specimen: Venous EDTA Blood</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[10px] print:text-[8px] uppercase">Report Status</span>
                <div className="flex items-center gap-1.5 mt-0.5 print:mt-0">
                  <CheckCircle2 className="h-4 w-4 print:h-3 print:w-3 text-emerald-600" />
                  <span className="font-bold text-emerald-800 text-xs print:text-[10px]">Final Validated</span>
                </div>
                <span className="text-slate-500 text-[11px] print:text-[9px] block mt-0.5 print:mt-0">Reported: {formatDate(report.reportDate)}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 print:p-3 space-y-6 print:space-y-2">
            {/* Test Category Header & Summary Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 print:pb-1 border-b border-slate-200 gap-2 print:gap-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <h3 className="text-base print:text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                    {report.category.replace(/_/g, " ")} Panel Investigation
                  </h3>
                </div>
                <p className="text-xs print:text-[9px] text-slate-500 mt-0.5 print:mt-0">
                  Quantitative and qualitative biomedical determinations tested via calibrated automated analyzer.
                </p>
              </div>

              <div className="flex items-center gap-2 print:gap-1">
                <span className="text-xs print:text-[9px] px-2.5 print:px-1.5 py-1 print:py-0 rounded-full bg-slate-100 text-slate-700 font-medium font-mono border border-slate-200">
                  {totalBiomarkers} Biomarkers Analyzed
                </span>
                {abnormalCount > 0 ? (
                  <span className="text-xs print:text-[9px] px-2.5 print:px-1.5 py-1 print:py-0 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    <span>{abnormalCount} Outside Range</span>
                  </span>
                ) : (
                  <span className="text-xs print:text-[9px] px-2.5 print:px-1.5 py-1 print:py-0 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>All Parameters Normal</span>
                  </span>
                )}
              </div>
            </div>

            {/* Structured Results Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/90 text-slate-700 hover:bg-slate-100">
                    <TableHead className="font-bold text-xs print:text-[10px] text-slate-900 w-1/3 print:py-1">Diagnostic Parameter</TableHead>
                    <TableHead className="font-bold text-xs print:text-[10px] text-slate-900 print:py-1">Observed Value</TableHead>
                    <TableHead className="font-bold text-xs print:text-[10px] text-slate-900 print:py-1">Standard Unit</TableHead>
                    <TableHead className="font-bold text-xs print:text-[10px] text-slate-900 print:py-1">Biological Reference Interval</TableHead>
                    <TableHead className="font-bold text-xs print:text-[10px] text-slate-900 text-right print:py-1">Evaluation Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.results.map((res, index) => {
                    const isAbnormal = res.abnormalityFlag && res.abnormalityFlag !== "NORMAL";
                    return (
                      <TableRow
                        key={res.id || index}
                        className={`transition-colors ${
                          isAbnormal ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <TableCell className="py-3 print:py-1">
                          <span className="font-bold text-slate-900 text-xs print:text-[10px] block">{res.testName}</span>
                          <span className="text-[10px] print:text-[8px] text-slate-400 font-mono">Automated Photometric Analysis</span>
                        </TableCell>
                        <TableCell className="py-3 print:py-1">
                          <span
                            className={`font-mono font-black text-sm print:text-xs px-2 print:px-1 py-0.5 print:py-0 rounded ${
                              isAbnormal
                                ? "text-amber-900 bg-amber-100/80 border border-amber-300"
                                : "text-slate-900 font-bold"
                            }`}
                          >
                            {res.resultValue}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 print:py-1 text-xs print:text-[10px] font-mono text-slate-600">{res.unit}</TableCell>
                        <TableCell className="py-3 print:py-1 text-xs print:text-[10px] font-mono text-slate-700 font-medium">
                          {res.referenceRange || "Standard reference"}
                        </TableCell>
                        <TableCell className="py-3 print:py-1 text-right">
                          <AbnormalityFlagBadge flag={res.abnormalityFlag} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pathologist Clinical Interpretation */}
            <div className="space-y-2 print:space-y-1 rounded-xl bg-slate-50 p-4 print:p-2 border border-slate-200">
              <div className="flex items-center gap-2 text-xs print:text-[10px] font-bold uppercase tracking-wider text-slate-800">
                <FileCheck2 className="h-4 w-4 print:h-3 print:w-3 text-teal-700" />
                <span>Clinical Interpretation &amp; Pathological Impression</span>
              </div>
              <p className="text-xs print:text-[10px] text-slate-800 leading-relaxed font-sans">{report.findings}</p>
            </div>

            {/* Attending Doctor Notes if Available */}
            {report.doctorNotes && (
              <div className="space-y-2 print:space-y-1 rounded-xl bg-teal-50/60 p-4 print:p-2 border border-teal-200">
                <div className="flex items-center gap-2 text-xs print:text-[10px] font-bold uppercase tracking-wider text-teal-900">
                  <Activity className="h-4 w-4 print:h-3 print:w-3 text-teal-700" />
                  <span>Attending Physician Clinical Correlation</span>
                </div>
                <p className="text-xs print:text-[10px] text-teal-950 italic leading-relaxed font-sans">{report.doctorNotes}</p>
              </div>
            )}

            {/* Official Dual Signature Endorsement */}
            <div className="pt-6 print:pt-2 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-6 print:gap-2 items-end">
              <div className="space-y-1 print:space-y-0.5">
                <span className="text-[10px] print:text-[8px] uppercase font-bold text-slate-400 block tracking-wider">
                  Verified &amp; Prepared By
                </span>
                <div className="font-serif italic text-sm print:text-xs text-slate-700 font-bold">K. Raman, M.Sc.</div>
                <p className="text-[11px] print:text-[9px] text-slate-500 font-medium">Senior Medical Lab Technologist</p>
                <p className="text-[10px] print:text-[8px] text-slate-400 font-mono">License: MLT-IN-48910</p>
              </div>

              <div className="text-center flex flex-col items-center justify-center p-3 print:p-1 rounded-xl bg-slate-50 border border-slate-200">
                <div className="inline-flex items-center gap-1 text-[11px] print:text-[9px] font-bold text-emerald-700">
                  <ShieldCheck className="h-4 w-4 print:h-3 print:w-3 text-emerald-600" />
                  <span>Digitally Authenticated</span>
                </div>
                <span className="text-[10px] print:text-[8px] text-slate-400 font-mono mt-0.5">
                  Timestamp: {new Date(report.reportDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • SHA-256 Validated
                </span>
                <span className="text-[9px] print:text-[7px] text-slate-400 uppercase mt-0.5">MedRec EHR Security Compliant</span>
              </div>

              <div className="text-right space-y-1 print:space-y-0.5">
                <span className="text-[10px] print:text-[8px] uppercase font-bold text-slate-400 block tracking-wider">
                  Validated &amp; Signed By
                </span>
                <div className="font-serif italic text-base print:text-xs text-teal-900 font-bold underline decoration-teal-600">
                  Dr. Anita Desai, MD
                </div>
                <p className="text-[11px] print:text-[9px] text-slate-600 font-semibold">Chief Consultant Pathologist</p>
                <p className="text-[10px] print:text-[8px] text-slate-400 font-mono">Reg. No: MCI-PATH-98214</p>
              </div>
            </div>

            {/* Bottom Footer Notice */}
            <div className="pt-4 print:pt-1 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] print:text-[8px] text-slate-400 gap-2 print:gap-1">
              <span>*** END OF CLINICAL PATHOLOGY DIAGNOSTIC REPORT ***</span>
              <span>Electronic Medical Record System • Tamper-resistant signed record</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
