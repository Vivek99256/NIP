"use client";

import React, { useState } from "react";
import { MockMedicalDocument } from "@/lib/db/mock-data";
import { createMedicalDocumentAction } from "@/features/documents/document-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { FileUploader } from "@/components/shared/file-uploader";
import { DocumentPreviewModal } from "@/components/shared/document-preview-modal";
import { FolderOpen, Plus, Eye, Download, X, AlertCircle, Paperclip } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  patientId: string;
  initialDocuments: MockMedicalDocument[];
}

const CATEGORIES = [
  { id: "ALL", label: "All Documents" },
  { id: "DISCHARGE_SUMMARY", label: "Discharge Summary" },
  { id: "MEDICAL_CERTIFICATE", label: "Medical Certificate" },
  { id: "REFERRAL_LETTER", label: "Referral Letter" },
  { id: "OPERATION_REPORT", label: "Operation Report" },
  { id: "OTHER", label: "Other" },
];

export function DocumentsManager({ patientId, initialDocuments }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<MockMedicalDocument | null>(null);

  // New Document Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<any>("MEDICAL_CERTIFICATE");
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [fileId, setFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await createMedicalDocumentAction({
      patientId,
      title,
      category,
      documentDate,
      description,
      fileId: fileId || undefined,
    });

    setIsLoading(false);
    if (result.success && result.document) {
      setDocuments([result.document, ...documents]);
      setIsUploadOpen(false);
      setTitle("");
      setDescription("");
      setFileId(null);
    } else {
      setError(result.error || "Failed to save document");
    }
  };

  const filtered = documents.filter((d) => {
    return activeCategory === "ALL" || d.category === activeCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <Button onClick={() => setIsUploadOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" />
          <span>Add Medical Document</span>
        </Button>
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FolderOpen}
                title="No Documents in Category"
                description="Upload medical certificates, referral letters, or discharge summaries to your secure health record."
                actionLabel="Upload First Document"
                onAction={() => setIsUploadOpen(true)}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Document Title</TableHead>
                  <TableHead>Document Date</TableHead>
                  <TableHead>Summary / Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Badge variant="purple" className="font-semibold text-[11px]">
                        {doc.category.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{doc.title}</span>
                        {doc.fileId && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Paperclip className="h-3 w-3" />
                            {/\.(jpg|jpeg|png|webp)$/i.test(doc.fileId) ? "Image" : "PDF"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDate(doc.documentDate)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-sm truncate">
                      {doc.description || "Official medical document"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewDoc(doc)}
                          className="h-8 gap-1 text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Button>
                        {doc.fileId && (
                          <a
                            href={`/api/documents/download?key=${encodeURIComponent(doc.fileId)}`}
                            download
                            title="Download document file"
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-bold text-slate-900">Upload Medical Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4 mt-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g. Discharge Summary - Surgery"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                    <option value="MEDICAL_CERTIFICATE">Medical Certificate</option>
                    <option value="REFERRAL_LETTER">Referral Letter</option>
                    <option value="OPERATION_REPORT">Operation Report</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="docDate">Document Date</Label>
                  <Input
                    id="docDate"
                    type="date"
                    required
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc">Notes / Description</Label>
                <textarea
                  id="desc"
                  rows={2}
                  placeholder="Brief summary of document..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Attach Document File</Label>
                <FileUploader
                  onUploadSuccess={(id) => setFileId(id)}
                  entityType="MedicalDocument"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isLoading}>
                  Save Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          category={previewDoc.category}
          date={formatDate(previewDoc.documentDate)}
          fileUrl={
            previewDoc.fileId
              ? `/api/documents/download?key=${encodeURIComponent(previewDoc.fileId)}&inline=true`
              : undefined
          }
          fileType={
            previewDoc.fileId && /\.(jpg|jpeg|png|webp)$/i.test(previewDoc.fileId)
              ? "image"
              : "pdf"
          }
          mockContent={{
            notes: previewDoc.description,
          }}
        />
      )}
    </div>
  );
}
