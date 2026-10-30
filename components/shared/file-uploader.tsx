"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface FileUploaderProps {
  onUploadSuccess: (fileId: string, filename: string) => void;
  entityType?: string;
  entityId?: string;
}

export function FileUploader({ onUploadSuccess, entityType, entityId }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ filename: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError(`File is too large (${formatFileSize(file.size)}). Maximum allowed is 15 MB.`);
      return;
    }

    // Validate type
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Invalid file format. Allowed formats: PDF, JPEG, PNG, WEBP.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (entityType) formData.append("entityType", entityType);
    if (entityId) formData.append("entityId", entityId);

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File upload failed");
      }

      setUploadedFile({ filename: file.name, size: file.size });
      onUploadSuccess(data.fileId, file.name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload error";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      {uploadedFile ? (
        <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-950">{uploadedFile.filename}</p>
              <p className="text-xs text-emerald-700">{formatFileSize(uploadedFile.size)} • Encrypted & Stored Privately</p>
            </div>
          </div>
          <button
            onClick={() => setUploadedFile(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isDragging
              ? "border-sky-500 bg-sky-50/50"
              : "border-slate-300 hover:border-sky-400 bg-slate-50/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          <div className="p-3 bg-white rounded-full shadow-xs text-sky-600 border border-slate-200">
            <UploadCloud className="h-6 w-6" />
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-800">
            {isUploading ? "Uploading file..." : "Click or drag medical report here"}
          </p>
          <p className="mt-1 text-xs text-slate-500">PDF, JPEG, PNG, or WEBP up to 15 MB</p>

          {isUploading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-sky-600 font-medium">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Hashing and encrypting to secure storage...</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2.5 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
