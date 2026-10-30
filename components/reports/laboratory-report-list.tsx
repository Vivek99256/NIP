"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MockLaboratoryReport } from "@/lib/db/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { DocumentPreviewModal } from "@/components/shared/document-preview-modal";
import { FlaskConical, Search, Eye, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  reports: MockLaboratoryReport[];
  selectedCategory: string;
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

export function LaboratoryReportList({ reports, selectedCategory: initialCategory }: Props) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewReport, setPreviewReport] = useState<MockLaboratoryReport | null>(null);

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

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
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
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Category</TableHead>
                  <TableHead>Laboratory Name</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Structured Biomarkers</TableHead>
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
                      {report.laboratoryName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDate(report.reportDate)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {report.results.length} Structured Values
                      </span>
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
                          Structured View
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
    </div>
  );
}
