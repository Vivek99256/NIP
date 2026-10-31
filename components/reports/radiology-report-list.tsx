"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MockRadiologyReport } from "@/lib/db/mock-data";
import { createRadiologyReportAction } from "@/features/radiology/radiology-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { FileUploader } from "@/components/shared/file-uploader";
import { DocumentPreviewModal } from "@/components/shared/document-preview-modal";
import { FileScan, Search, Eye, Plus, X, AlertCircle, Paperclip } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  reports: MockRadiologyReport[];
  selectedCategory: string;
  patientId?: string;
  canUpload?: boolean;
}

const CATEGORIES = [
  { id: "ALL", label: "All Imaging" },
  { id: "X_RAY", label: "X-Ray" },
  { id: "CT_SCAN", label: "CT Scan" },
  { id: "MRI", label: "MRI" },
  { id: "SONOGRAPHY_ULTRASOUND", label: "Sonography" },
  { id: "PET_CT_SCAN", label: "PET-CT Scan" },
  { id: "OTHER", label: "Other" },
];

export function RadiologyReportList({
  reports: initialReports,
  selectedCategory: initialCategory,
  patientId,
  canUpload = false,
}: Props) {
  const [reports, setReports] = useState<MockRadiologyReport[]>(initialReports);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewReport, setPreviewReport] = useState<MockRadiologyReport | null>(null);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [category, setCategory] = useState<any>("X_RAY");
  const [diagnosticCentre, setDiagnosticCentre] = useState("");
  const [radiologistName, setRadiologistName] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [findings, setFindings] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
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

    const result = await createRadiologyReportAction({
      patientId,
      category,
      diagnosticCentre,
      radiologistName,
      testDate,
      reportDate,
      findings,
      clinicalNotes: clinicalNotes || undefined,
      pdfFileId: pdfFileId || undefined,
    });

    setIsLoading(false);
    if (result.success && result.report) {
      setReports([result.report, ...reports]);
      setIsUploadOpen(false);
      setDiagnosticCentre("");
      setRadiologistName("");
      setFindings("");
      setClinicalNotes("");
      setPdfFileId(null);
    } else {
      setError(result.error || "Failed to save radiology report");
    }
  };

  const filtered = reports.filter((r) => {
    const matchesCategory = activeCategory === "ALL" || r.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      r.findings.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.diagnosticCentre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.radiologistName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search findings, clinic, or radiologist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-sky-600 text-white shadow-xs"
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
              className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Radiology Report</span>
            </Button>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileScan}
                title="No Radiology Reports Found"
                description={
                  searchQuery || activeCategory !== "ALL"
                    ? "No imaging reports matched your current filter selection."
                    : "No radiological imaging or scan reports are on file for your medical record."
                }
                actionLabel={canUpload ? "Upload First Radiology Report" : undefined}
                onAction={canUpload ? () => setIsUploadOpen(true) : undefined}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Diagnostic Centre</TableHead>
                  <TableHead>Radiologist</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Key Findings Summary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant="default" className="font-semibold text-[11px]">
                        {report.category.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{report.diagnosticCentre}</span>
                        {report.pdfFileId && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Paperclip className="h-3 w-3" />
                            {/\.(jpg|jpeg|png|webp)$/i.test(report.pdfFileId) ? "Image" : "PDF"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{report.radiologistName}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDate(report.reportDate)}
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
                      <Link href={`/reports/radiology/${report.id}`}>
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

      {/* Interactive Modal Preview */}
      {previewReport && (
        <DocumentPreviewModal
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          title={`${previewReport.category.replace(/_/g, " ")} Report - ${previewReport.diagnosticCentre}`}
          category={previewReport.category}
          date={formatDate(previewReport.reportDate)}
          fileUrl={
            previewReport.pdfFileId
              ? `/api/documents/download?key=${encodeURIComponent(previewReport.pdfFileId)}&inline=true`
              : undefined
          }
          fileType={
            previewReport.pdfFileId && /\.(jpg|jpeg|png|webp)$/i.test(previewReport.pdfFileId)
              ? "image"
              : "pdf"
          }
          mockContent={{
            radiologist: previewReport.radiologistName,
            findings: previewReport.findings,
            notes: previewReport.clinicalNotes,
          }}
        />
      )}

      {/* Upload Radiology Report Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <FileScan className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Upload Radiology Report</h3>
                  <p className="text-xs text-slate-500">Add X-Ray, CT-Scan, MRI or Sonography reports</p>
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
                  <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                    Modality / Category
                  </Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="X_RAY">X-Ray</option>
                    <option value="CT_SCAN">CT Scan</option>
                    <option value="MRI">MRI</option>
                    <option value="SONOGRAPHY_ULTRASOUND">Sonography / Ultrasound</option>
                    <option value="PET_CT_SCAN">PET-CT Scan</option>
                    <option value="OTHER">Other Imaging</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reportDate" className="text-xs font-semibold text-slate-700">
                    Report Date
                  </Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="diagnosticCentre" className="text-xs font-semibold text-slate-700">
                    Diagnostic Centre / Hospital
                  </Label>
                  <Input
                    id="diagnosticCentre"
                    placeholder="e.g. Metro Imaging Center"
                    value={diagnosticCentre}
                    onChange={(e) => setDiagnosticCentre(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="radiologistName" className="text-xs font-semibold text-slate-700">
                    Radiologist / Consultant
                  </Label>
                  <Input
                    id="radiologistName"
                    placeholder="e.g. Dr. Rajesh Kumar, MD"
                    value={radiologistName}
                    onChange={(e) => setRadiologistName(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="findings" className="text-xs font-semibold text-slate-700">
                  Key Findings & Impression
                </Label>
                <textarea
                  id="findings"
                  rows={3}
                  placeholder="Summary of radiological impression (e.g. No focal consolidation, normal cardiothoracic ratio)..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  required
                  className="w-full text-xs rounded-md border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="clinicalNotes" className="text-xs font-semibold text-slate-700">
                  Clinical Notes / Reason for Scan (Optional)
                </Label>
                <Input
                  id="clinicalNotes"
                  placeholder="e.g. Persistent cough for 2 weeks"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <Label>Attach Report File (PDF or Image)</Label>
                <FileUploader
                  onUploadSuccess={(id) => setPdfFileId(id)}
                  entityType="RadiologyReport"
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
                  className="text-xs bg-sky-600 hover:bg-sky-700"
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
