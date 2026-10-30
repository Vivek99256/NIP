"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MockRadiologyReport, MockLaboratoryReport, MockPatientProfile } from "@/lib/db/mock-data";
import {
  doctorCreateRadiologyReportAction,
  doctorCreateLaboratoryReportAction,
} from "@/features/reports/report-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  FileScan,
  FlaskConical,
  Plus,
  Search,
  ArrowRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { FileUploader } from "@/components/shared/file-uploader";

interface Props {
  initialRadiology: MockRadiologyReport[];
  initialLabs: MockLaboratoryReport[];
  patients: MockPatientProfile[];
  doctorName: string;
}

export function DoctorReportsManager({
  initialRadiology,
  initialLabs,
  patients,
  doctorName,
}: Props) {
  const [radiologyList, setRadiologyList] = useState<MockRadiologyReport[]>(initialRadiology);
  const [labList, setLabList] = useState<MockLaboratoryReport[]>(initialLabs);
  const [activeTab, setActiveTab] = useState<"ALL" | "RADIOLOGY" | "LABORATORY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRadiologyModalOpen, setIsRadiologyModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Radiology Form State
  const [radPatientId, setRadPatientId] = useState(patients[0]?.id || "");
  const [radCategory, setRadCategory] = useState<any>("X_RAY");
  const [radTestDate, setRadTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [radCentre, setRadCentre] = useState("Metro Advanced Imaging Institute");
  const [radDoctor, setRadDoctor] = useState(doctorName);
  const [radFindings, setRadFindings] = useState("");
  const [radNotes, setRadNotes] = useState("");
  const [radFileId, setRadFileId] = useState<string | null>(null);

  // Lab Form State
  const [labPatientId, setLabPatientId] = useState(patients[0]?.id || "");
  const [labCategory, setLabCategory] = useState<any>("CBC");
  const [labTestDate, setLabTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [labName, setLabName] = useState("Metropolis Clinical Laboratory");
  const [labFindings, setLabFindings] = useState("");
  const [labFileId, setLabFileId] = useState<string | null>(null);
  const [labResults, setLabResults] = useState([
    { testName: "Hemoglobin", resultValue: "14.5", unit: "g/dL", referenceRange: "13.0 - 17.0", abnormalityFlag: "NORMAL" as const },
    { testName: "Total Leukocyte Count (TLC)", resultValue: "7800", unit: "/cumm", referenceRange: "4000 - 11000", abnormalityFlag: "NORMAL" as const },
    { testName: "Platelet Count", resultValue: "245000", unit: "/cumm", referenceRange: "150000 - 450000", abnormalityFlag: "NORMAL" as const },
  ]);

  const patientMap = new Map(patients.map((p) => [p.id, p]));

  // Filtering
  const filteredRadiology = radiologyList.filter((r) => {
    if (activeTab === "LABORATORY") return false;
    const pat = patientMap.get(r.patientId);
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      r.findings.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.diagnosticCentre.toLowerCase().includes(q) ||
      (pat && pat.fullName.toLowerCase().includes(q))
    );
  });

  const filteredLabs = labList.filter((l) => {
    if (activeTab === "RADIOLOGY") return false;
    const pat = patientMap.get(l.patientId);
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      l.findings.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.laboratoryName.toLowerCase().includes(q) ||
      (pat && pat.fullName.toLowerCase().includes(q))
    );
  });

  const handleCreateRadiology = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!radPatientId || !radFindings.trim()) {
      toast.error("Please select a patient and enter clinical findings");
      return;
    }

    setIsSubmitting(true);
    const res = await doctorCreateRadiologyReportAction({
      patientId: radPatientId,
      category: radCategory,
      testDate: radTestDate,
      diagnosticCentre: radCentre,
      radiologistName: radDoctor,
      findings: radFindings,
      clinicalNotes: radNotes,
      pdfFileId: radFileId || undefined,
    });
    setIsSubmitting(false);

    if (res.success && res.report) {
      setRadiologyList([res.report, ...radiologyList]);
      setIsRadiologyModalOpen(false);
      setRadFindings("");
      setRadNotes("");
      setRadFileId(null);
      toast.success("Radiology report created successfully");
    } else {
      toast.error(res.error || "Failed to issue radiology report");
    }
  };

  const handleAddBiomarkerRow = () => {
    setLabResults([
      ...labResults,
      { testName: "", resultValue: "", unit: "", referenceRange: "", abnormalityFlag: "NORMAL" },
    ]);
  };

  const handleRemoveBiomarkerRow = (index: number) => {
    setLabResults(labResults.filter((_, idx) => idx !== index));
  };

  const handleBiomarkerChange = (index: number, field: string, value: any) => {
    const updated = [...labResults];
    (updated[index] as any)[field] = value;
    setLabResults(updated);
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labPatientId || !labFindings.trim()) {
      toast.error("Please select a patient and enter findings summary");
      return;
    }

    setIsSubmitting(true);
    const res = await doctorCreateLaboratoryReportAction({
      patientId: labPatientId,
      category: labCategory,
      testDate: labTestDate,
      laboratoryName: labName,
      findings: labFindings,
      pdfFileId: labFileId || undefined,
      results: labResults,
    });
    setIsSubmitting(false);

    if (res.success && res.report) {
      setLabList([res.report, ...labList]);
      setIsLabModalOpen(false);
      setLabFindings("");
      setLabFileId(null);
      toast.success("Pathology laboratory report created successfully");
    } else {
      toast.error(res.error || "Failed to issue laboratory report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <FileScan className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Clinical Diagnostic Reports Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Full CRUD control: Issue radiology scan findings, upload pathology lab results, or audit patient diagnostic history.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsRadiologyModalOpen(true)}
            className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Issue Radiology Scan</span>
          </Button>

          <Button
            onClick={() => setIsLabModalOpen(true)}
            className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Issue Lab Report</span>
          </Button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Diagnostic Reports ({radiologyList.length + labList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RADIOLOGY")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "RADIOLOGY"
                ? "bg-white text-sky-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileScan className="h-3.5 w-3.5 text-sky-600" />
            <span>Radiology Scans ({radiologyList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LABORATORY")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "LABORATORY"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5 text-teal-600" />
            <span>Pathology Labs ({labList.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search findings, patient name, lab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* RADIOLOGY REPORTS TABLE */}
      {(activeTab === "ALL" || activeTab === "RADIOLOGY") && (
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileScan className="h-4 w-4 text-sky-600" />
              <span>Radiological Imaging &amp; Scans ({filteredRadiology.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Clinical Findings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRadiology.map((r) => {
                  const pat = patientMap.get(r.patientId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Badge variant="default" className="text-[10px]">{r.category}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-slate-900">
                        {pat?.fullName || "Patient"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{r.diagnosticCentre}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {formatDate(r.reportDate)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                        {r.findings}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/reports/radiology/${r.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-slate-200">
                            <span>View Full Scan</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredRadiology.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                      No radiology scan reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* LABORATORY REPORTS TABLE */}
      {(activeTab === "ALL" || activeTab === "LABORATORY") && (
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-teal-600" />
              <span>Pathology &amp; Laboratory Panels ({filteredLabs.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Panel Type</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Laboratory</TableHead>
                  <TableHead>Test Date</TableHead>
                  <TableHead>Biomarkers Tested</TableHead>
                  <TableHead>Clinical Findings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLabs.map((l) => {
                  const pat = patientMap.get(l.patientId);
                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        <Badge variant="teal" className="text-[10px]">{l.category}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-slate-900">
                        {pat?.fullName || "Patient"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{l.laboratoryName}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {formatDate(l.testDate)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-700">
                        {l.results.length} Biomarkers
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                        {l.findings}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/reports/laboratory/${l.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-slate-200">
                            <span>View Lab Panel</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredLabs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                      No laboratory reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ISSUE RADIOLOGY REPORT MODAL */}
      {isRadiologyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                  <FileScan className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Issue Radiology Scan Report</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRadiologyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRadiology} className="mt-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label htmlFor="radPatient">Select Authorized Patient</Label>
                <select
                  id="radPatient"
                  value={radPatientId}
                  onChange={(e) => setRadPatientId(e.target.value)}
                  required
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2 text-xs"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.patientId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="radCat">Imaging Modality Category</Label>
                  <select
                    id="radCat"
                    value={radCategory}
                    onChange={(e) => setRadCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    <option value="X_RAY">X-Ray</option>
                    <option value="CT_SCAN">CT Scan</option>
                    <option value="MRI">MRI</option>
                    <option value="SONOGRAPHY_ULTRASOUND">Ultrasound / Sonography</option>
                    <option value="PET_CT_SCAN">PET-CT Scan</option>
                    <option value="OTHER">Other Imaging</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="radDate">Scan Test Date</Label>
                  <Input
                    id="radDate"
                    type="date"
                    value={radTestDate}
                    onChange={(e) => setRadTestDate(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="radCentre">Diagnostic Facility</Label>
                  <Input
                    id="radCentre"
                    value={radCentre}
                    onChange={(e) => setRadCentre(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="radDoc">Reporting Radiologist</Label>
                  <Input
                    id="radDoc"
                    value={radDoctor}
                    onChange={(e) => setRadDoctor(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="radFindings">Radiological Findings &amp; Clinical Impression</Label>
                <textarea
                  id="radFindings"
                  rows={3}
                  value={radFindings}
                  onChange={(e) => setRadFindings(e.target.value)}
                  placeholder="e.g. Normal cardiothoracic ratio. No focal consolidation, pneumothorax, or pleural effusion visualized."
                  required
                  className="w-full rounded-md border border-slate-300 p-2 text-xs font-sans"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="radNotes">Physician Clinical Recommendations</Label>
                <Input
                  id="radNotes"
                  value={radNotes}
                  onChange={(e) => setRadNotes(e.target.value)}
                  placeholder="e.g. Correlation with clinical symptoms advised. Review after 3 weeks."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <Label>Attach Scan Document / Images (PDF, JPEG, PNG)</Label>
                <FileUploader
                  onUploadSuccess={(id) => setRadFileId(id)}
                  entityType="RadiologyReport"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRadiologyModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Issue Radiology Scan</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE LABORATORY REPORT MODAL */}
      {isLabModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Issue Pathology Laboratory Report</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLabModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="labPatient">Select Patient</Label>
                  <select
                    id="labPatient"
                    value={labPatientId}
                    onChange={(e) => setLabPatientId(e.target.value)}
                    required
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.patientId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="labCat">Pathology Panel</Label>
                  <select
                    id="labCat"
                    value={labCategory}
                    onChange={(e) => setLabCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    <option value="CBC">Complete Blood Count (CBC)</option>
                    <option value="BLOOD_SUGAR">Blood Glucose (Fasting &amp; PP)</option>
                    <option value="KIDNEY_FUNCTION_TEST">Kidney Function Test (KFT)</option>
                    <option value="LIVER_FUNCTION_TEST">Liver Function Test (LFT)</option>
                    <option value="URINE_TEST">Urinalysis Routine Test</option>
                    <option value="HISTOPATHOLOGY">Histopathology</option>
                    <option value="BIOPSY">Biopsy</option>
                    <option value="BT_CT_PT">BT, CT &amp; PT Coagulation Profile</option>
                    <option value="HIV_TEST">HIV Test</option>
                    <option value="HBSAG_TEST">HBsAg Hepatitis B Test</option>
                    <option value="OTHER">Other Panel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="labName">Laboratory Center</Label>
                  <Input
                    id="labName"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="labDate">Specimen Test Date</Label>
                  <Input
                    id="labDate"
                    type="date"
                    value={labTestDate}
                    onChange={(e) => setLabTestDate(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Biomarkers Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-800">Biomarker Results</Label>
                  <button
                    type="button"
                    onClick={handleAddBiomarkerRow}
                    className="text-teal-700 hover:text-teal-800 font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Biomarker Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {labResults.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="col-span-4">
                        <Input
                          placeholder="Test Parameter"
                          value={row.testName}
                          onChange={(e) => handleBiomarkerChange(idx, "testName", e.target.value)}
                          required
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Value"
                          value={row.resultValue}
                          onChange={(e) => handleBiomarkerChange(idx, "resultValue", e.target.value)}
                          required
                          className="text-xs h-8 font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Unit"
                          value={row.unit}
                          onChange={(e) => handleBiomarkerChange(idx, "unit", e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Normal Range"
                          value={row.referenceRange}
                          onChange={(e) => handleBiomarkerChange(idx, "referenceRange", e.target.value)}
                          className="text-xs h-8 font-mono"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <select
                          value={row.abnormalityFlag}
                          onChange={(e) => handleBiomarkerChange(idx, "abnormalityFlag", e.target.value)}
                          className="h-8 rounded border border-slate-300 text-[10px] px-1 bg-white w-full"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="LOW">Low</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                        {labResults.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBiomarkerRow(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="labFindings">Pathologist Findings Summary</Label>
                <textarea
                  id="labFindings"
                  rows={2}
                  value={labFindings}
                  onChange={(e) => setLabFindings(e.target.value)}
                  placeholder="e.g. Hemogram within normal physiological limits. Normal platelet indices."
                  required
                  className="w-full rounded-md border border-slate-300 p-2 text-xs font-sans"
                />
              </div>

              <div className="space-y-1 pt-1">
                <Label>Attach Pathology Scan / Report Copy (PDF, JPEG, PNG)</Label>
                <FileUploader
                  onUploadSuccess={(id) => setLabFileId(id)}
                  entityType="LaboratoryReport"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLabModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Issue Laboratory Panel</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
