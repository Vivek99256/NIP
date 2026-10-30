"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MockRadiologyReport } from "@/lib/db/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { DocumentPreviewModal } from "@/components/shared/document-preview-modal";
import { FileScan, Search, Eye, Download, Calendar, Building2, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  reports: MockRadiologyReport[];
  selectedCategory: string;
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

export function RadiologyReportList({ reports, selectedCategory: initialCategory }: Props) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewReport, setPreviewReport] = useState<MockRadiologyReport | null>(null);

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

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
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
                        {report.category.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 text-xs">
                      {report.diagnosticCentre}
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
          title={`${previewReport.category.replace("_", " ")} Report`}
          category={previewReport.category}
          date={formatDate(previewReport.reportDate)}
          mockContent={{
            radiologist: previewReport.radiologistName,
            findings: previewReport.findings,
            notes: previewReport.clinicalNotes,
          }}
        />
      )}
    </div>
  );
}
