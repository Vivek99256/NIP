"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MockLaboratoryReport } from "@/lib/db/mock-data";
import { createLaboratoryReportAction } from "@/features/laboratory/laboratory-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { FileUploader } from "@/components/shared/file-uploader";
import { DocumentPreviewModal } from "@/components/shared/document-preview-modal";
import { FlaskConical, Search, Eye, Plus, X, AlertCircle, Paperclip } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  reports: MockLaboratoryReport[];
  selectedCategory: string;
  patientId?: string;
  canUpload?: boolean;
}

const LAB_CATEGORIES = [
  { id: "ALL", label: "All Tests" },
  { id: "CBC", label: "CBC" },
  { id: "BLOOD_SUGAR", label: "Blood Sugar" },
  { id: "KIDNEY_FUNCTION_TEST", label: "Kidney Function (KFT)" },
  { id: "LIVER_FUNCTION_TEST", label: "Liver Function (LFT)" },
  { id: "URINE_TEST", label: "Urine Test" },
  { id: "HISTOPATHOLOGY", label: "Histopathology" },
  { id: "BIOPSY", label: "Biopsy" },
  { id: "BT_CT_PT", label: "BT / CT / PT" },
  { id: "HIV_TEST", label: "HIV" },
  { id: "HBSAG_TEST", label: "HBsAg" },
  { id: "OTHER", label: "Others" },
];

export function LaboratoryReportList({
  reports: initialReports,
  selectedCategory: initialCategory,
  patientId,
  canUpload = false,
}: Props) {
  const [reports, setReports] = useState<MockLaboratoryReport[]>(initialReports);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewReport, setPreviewReport] = useState<MockLaboratoryReport | null>(null);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [category, setCategory] = useState<any>("CBC");
  const [laboratoryName, setLaboratoryName] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [findings, setFindings] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [pdfFileId, setPdfFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError("Patient ID not found");
      return;
    }
    setError(null);
    setIsLoading(true);

    const result = await createLaboratoryReportAction({
      patientId,
      category,
      laboratoryName,
      testDate,
      reportDate,
      findings,
      doctorNotes: doctorNotes || undefined,
      pdfFileId: pdfFileId || undefined,
      results: [],
    });

    setIsLoading(false);
    if (result.success && result.report) {
      setReports([result.report, ...reports]);
      setIsUploadOpen(false);
      setLaboratoryName("");
      setFindings("");
      setDoctorNotes("");
      setPdfFileId(null);
    } else {
      setError(result.error || "Failed to save laboratory report");
    }
  };

  const filtered = reports.filter((r) => {
    const matchesCategory = activeCategory === "ALL" || r.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      r.findings.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.laboratoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.results.some((res) => res.testName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search test panel, lab, or biomarker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex flex-wrap gap-1.5">
            {LAB_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {canUpload && (
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Laboratory Report</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FlaskConical}
                title="No Laboratory Reports Found"
                description={
                  searchQuery || activeCategory !== "ALL"
                    ? "No laboratory reports matched your current filter criteria."
                    : "No pathology or laboratory test reports are on file for your medical record."
                }
                actionLabel={canUpload ? "Upload First Lab Report" : undefined}
                onAction={canUpload ? () => setIsUploadOpen(true) : undefined}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Category</TableHead>
                  <TableHead>Laboratory Name</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Biomarkers / File</TableHead>
                  <TableHead>Pathologist Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant="teal" className="font-semibold text-[11px]">
                        {report.category.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{report.laboratoryName}</span>
                        {report.pdfFileId && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                            <Paperclip className="h-3 w-3" />
                            {/\.(jpg|jpeg|png|webp)$/i.test(report.pdfFileId) ? "Image" : "PDF"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDate(report.reportDate)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {report.results.length > 0 ? (
                        <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {report.results.length} Values
                        </span>
                      ) : report.pdfFileId ? (
                        <span className="text-slate-600 font-medium">Uploaded Document</span>
                      ) : (
                        <span className="text-slate-400">Clinical Report</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                      {report.findings}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewReport(report)}
                        className="h-8 gap-1 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </Button>
                      <Link href={`/reports/laboratory/${report.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          Details
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

      {previewReport && (
        <DocumentPreviewModal
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          title={`${previewReport.category.replace(/_/g, " ")} Report`}
          category={previewReport.category}
          date={formatDate(previewReport.reportDate)}
          mockContent={{
            laboratory: previewReport.laboratoryName,
            findings: previewReport.findings,
            notes: previewReport.doctorNotes,
          }}
        />
      )}

      {/* Upload Laboratory Report Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Upload Laboratory Report</h3>
                  <p className="text-xs text-slate-500">Add Blood tests, Urine analysis, Biopsy or Pathology results</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="labCategory" className="text-xs font-semibold text-slate-700">
                    Test Category
                  </Label>
                  <select
                    id="labCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="CBC">Complete Blood Count (CBC)</option>
                    <option value="BLOOD_SUGAR">Blood Sugar (FBS / PPBS / HbA1c)</option>
                    <option value="KIDNEY_FUNCTION_TEST">Kidney Function Test (KFT)</option>
                    <option value="LIVER_FUNCTION_TEST">Liver Function Test (LFT)</option>
                    <option value="URINE_TEST">Urine Analysis</option>
                    <option value="HISTOPATHOLOGY">Histopathology</option>
                    <option value="BIOPSY">Biopsy</option>
                    <option value="BT_CT_PT">BT / CT / PT Coagulation</option>
                    <option value="HIV_TEST">HIV Test</option>
                    <option value="HBSAG_TEST">HBsAg Test</option>
                    <option value="OTHER">Other Lab Panel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="labReportDate" className="text-xs font-semibold text-slate-700">
                    Report Date
                  </Label>
                  <Input
                    id="labReportDate"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="laboratoryName" className="text-xs font-semibold text-slate-700">
                  Laboratory / Diagnostic Centre Name
                </Label>
                <Input
                  id="laboratoryName"
                  placeholder="e.g. Metropolis Lab / PathCare Diagnostics"
                  value={laboratoryName}
                  onChange={(e) => setLaboratoryName(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="findings" className="text-xs font-semibold text-slate-700">
                  Key Findings & Pathological Impression
                </Label>
                <textarea
                  id="findings"
                  rows={3}
                  placeholder="Summary of test results or doctor remarks (e.g. Platelets within normal limits, Hemoglobin 14.2 g/dL)..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  required
                  className="w-full text-xs rounded-md border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="doctorNotes" className="text-xs font-semibold text-slate-700">
                  Pathologist / Attending Notes (Optional)
                </Label>
                <Input
                  id="doctorNotes"
                  placeholder="e.g. Follow-up suggested after 3 months"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <Label>Attach Lab Report File (PDF or Image)</Label>
                <FileUploader
                  onUploadSuccess={(id) => setPdfFileId(id)}
                  entityType="LaboratoryReport"
                />
                {pdfFileId && (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    ✓ File uploaded successfully
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="text-xs bg-teal-600 hover:bg-teal-700"
                >
                  Save Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
