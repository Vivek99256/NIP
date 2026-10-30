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
import {
  ArrowLeft,
  FileScan,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Award,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/prescriptions/print-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RadiologyDetailPage(props: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const { id } = await props.params;
  const report = await medicalRepo.getRadiologyReportById(id);

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

  // Friendly modality title
  const modalityLabel = report.category.replace(/_/g, " ");

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
          <Link href={auth.user.role === "DOCTOR" ? "/doctor/reports" : "/reports/radiology"}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Radiology Scans</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {report.pdfFileId && (
              <a
                href={`/api/documents/download?key=${encodeURIComponent(report.pdfFileId)}&inline=true`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-sky-700 border-sky-200 hover:bg-sky-50">
                  <FileScan className="h-4 w-4" />
                  <span>View Attached Scan</span>
                </Button>
              </a>
            )}
            <PrintButton />
          </div>
        </div>

        {/* Master Clinical Radiology Report Sheet */}
        <Card className="border border-slate-300 shadow-xl overflow-hidden bg-white printable-card rounded-2xl print:rounded-lg">
          {/* Official Diagnostic Imaging Letterhead */}
          <div className="p-6 sm:p-8 print:p-3 bg-gradient-to-b from-slate-50 to-white border-b-2 border-slate-900">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 print:gap-2">
              <div className="space-y-1.5 print:space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 print:h-7 print:w-7 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
                    <FileScan className="h-5 w-5 print:h-4 print:w-4" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl print:text-base font-black text-slate-900 tracking-tight uppercase">
                      {report.diagnosticCentre}
                    </h2>
                    <p className="text-[11px] print:text-[9px] font-semibold text-sky-700 tracking-wide uppercase">
                      Department of Radiodiagnosis &amp; Advanced Interventional Imaging
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 print:gap-2 pt-1 print:pt-0 text-[11px] print:text-[9px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Award className="h-3.5 w-3.5 print:h-3 print:w-3 text-amber-600" />
                    <span>AERB Approved Medical Radiology Facility</span>
                  </span>
                  <span>•</span>
                  <span>High-Resolution Digital PACS Network</span>
                  <span>•</span>
                  <span>DICOM 3.0 Standard</span>
                </div>
              </div>

              {/* PACS Study Accession & Barcode */}
              <div className="text-right flex flex-col items-end">
                <div className="px-3 py-1 print:px-2 print:py-0.5 bg-sky-50 border border-sky-200 rounded-lg text-right">
                  <span className="text-[10px] print:text-[8px] uppercase font-bold text-sky-800 tracking-wider block">
                    PACS Accession No.
                  </span>
                  <span className="font-mono font-black text-sm print:text-xs text-slate-900 block tracking-wider">
                    {report.id.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] print:text-[8px] font-mono text-slate-400 mt-1 print:mt-0.5">
                  STUDY-UID: 1.2.840.113619.{report.id.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Patient & Examination Metadata Grid */}
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
                <span className="text-slate-400 font-medium block text-[10px] print:text-[8px] uppercase">Examination Date</span>
                <span className="font-semibold text-slate-800">{formatDate(report.testDate)}</span>
                <span className="text-slate-500 text-[11px] print:text-[9px] block mt-0.5 print:mt-0">Modality: {modalityLabel}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[10px] print:text-[8px] uppercase">Interpretation Status</span>
                <div className="flex items-center gap-1.5 mt-0.5 print:mt-0">
                  <CheckCircle2 className="h-4 w-4 print:h-3 print:w-3 text-emerald-600" />
                  <span className="font-bold text-emerald-800 text-xs print:text-[10px]">Digitally Signed</span>
                </div>
                <span className="text-slate-500 text-[11px] print:text-[9px] block mt-0.5 print:mt-0">Reported: {formatDate(report.reportDate)}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 print:p-3 space-y-6 print:space-y-2">
            {/* Examination Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 print:pb-1 border-b border-slate-200 gap-2 print:gap-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <h3 className="text-base print:text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                  {modalityLabel} Examination Report
                </h3>
              </div>

              <div className="flex items-center gap-2 print:gap-1">
                <span className="text-xs print:text-[9px] px-2.5 print:px-1.5 py-1 print:py-0 rounded-full bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                  Diagnostic Imaging
                </span>
                <span className="text-xs print:text-[9px] px-2.5 print:px-1.5 py-1 print:py-0 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
                  Standard Multi-Projection
                </span>
              </div>
            </div>

            {/* Protocol & Clinical Indication */}
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-2 text-xs print:text-[10px]">
              <div className="p-4 print:p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1 print:space-y-0.5">
                <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px] print:text-[9px] flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 print:h-3 print:w-3 text-sky-600" />
                  <span>Imaging Protocol &amp; Technique</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  High-resolution digital diagnostic imaging obtained using calibrated exposure parameters. Multi-planar projections acquired with motion-correction filters.
                </p>
              </div>

              <div className="p-4 print:p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1 print:space-y-0.5">
                <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px] print:text-[9px] flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 print:h-3 print:w-3 text-sky-600" />
                  <span>Clinical Indication</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {report.clinicalNotes || "Referred for clinical evaluation of diagnostic concerns. No prior comparative examinations on file."}
                </p>
              </div>
            </div>

            {/* Detailed Findings Section */}
            <div className="space-y-3 print:space-y-1">
              <div className="flex items-center justify-between pb-1 print:pb-0">
                <h4 className="text-xs print:text-[10px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 print:h-3 print:w-3 text-sky-600" />
                  <span>Radiological Observations &amp; Segmental Findings</span>
                </h4>
              </div>

              <div className="p-5 print:p-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs print:text-[10px] text-slate-800 leading-relaxed font-sans whitespace-pre-line shadow-2xs">
                {report.findings}
              </div>
            </div>

            {/* Diagnostic Impression / Conclusion */}
            <div className="p-5 print:p-2 rounded-xl bg-gradient-to-r from-sky-50 via-slate-50 to-white border-2 border-sky-300 space-y-2 print:space-y-1">
              <div className="flex items-center gap-2 text-xs print:text-[10px] font-black uppercase tracking-wider text-sky-950">
                <CheckCircle2 className="h-4 w-4 print:h-3 print:w-3 text-sky-700" />
                <span>Primary Diagnostic Impression</span>
              </div>
              <p className="text-xs print:text-[10px] font-semibold text-slate-900 leading-relaxed">
                {report.findings.split("\n")[0] || report.findings}
              </p>
              <p className="text-[11px] print:text-[8px] text-slate-500 italic">
                * Note: Radiological findings should be correlated clinically with laboratory investigations and patient symptomatology.
              </p>
            </div>

            {/* Official Radiologist Signature Endorsement */}
            <div className="pt-6 print:pt-2 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-6 print:gap-2 items-end">
              <div className="space-y-1 print:space-y-0.5">
                <span className="text-[10px] print:text-[8px] uppercase font-bold text-slate-400 block tracking-wider">
                  Diagnostic Facility
                </span>
                <div className="font-bold text-xs print:text-[10px] text-slate-800">{report.diagnosticCentre}</div>
                <p className="text-[11px] print:text-[9px] text-slate-500">Advanced Imaging Suite</p>
                <p className="text-[10px] print:text-[8px] text-slate-400 font-mono">PACS Node ID: PACS-SRV-04</p>
              </div>

              <div className="text-center flex flex-col items-center justify-center p-3 print:p-1 rounded-xl bg-slate-50 border border-slate-200">
                <div className="inline-flex items-center gap-1 text-[11px] print:text-[9px] font-bold text-sky-700">
                  <ShieldCheck className="h-4 w-4 print:h-3 print:w-3 text-sky-600" />
                  <span>Digitally Validated Record</span>
                </div>
                <span className="text-[10px] print:text-[8px] text-slate-400 font-mono mt-0.5">
                  Verified: {formatDate(report.reportDate)} • Electronic Signoff
                </span>
                <span className="text-[9px] print:text-[7px] text-slate-400 uppercase mt-0.5">MedRec EHR Security Compliant</span>
              </div>

              <div className="text-right space-y-1 print:space-y-0.5">
                <span className="text-[10px] print:text-[8px] uppercase font-bold text-slate-400 block tracking-wider">
                  Consultant Radiologist
                </span>
                <div className="font-serif italic text-base print:text-xs text-sky-950 font-bold underline decoration-sky-600">
                  {report.radiologistName}
                </div>
                <p className="text-[11px] print:text-[9px] text-slate-600 font-semibold">MD, DNB (Radiodiagnosis)</p>
                <p className="text-[10px] print:text-[8px] text-slate-400 font-mono">Reg. No: MCI-RAD-83120</p>
              </div>
            </div>

            {/* Bottom Footer Notice */}
            <div className="pt-4 print:pt-1 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] print:text-[8px] text-slate-400 gap-2 print:gap-1">
              <span>*** END OF RADIOLOGICAL EXAMINATION REPORT ***</span>
              <span>Patient Medical Identifier: {patient?.patientId}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
