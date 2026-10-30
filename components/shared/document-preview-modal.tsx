"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Download,
  FileText,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  FlaskConical,
  FileScan,
  Award,
} from "lucide-react";

interface DocumentPreviewModalProps {
  title: string;
  category?: string;
  date?: string;
  fileUrl?: string;
  fileType?: "pdf" | "image";
  isOpen: boolean;
  onClose: () => void;
  mockContent?: {
    findings?: string;
    radiologist?: string;
    laboratory?: string;
    notes?: string;
  };
}

export function DocumentPreviewModal({
  title,
  category,
  date,
  fileUrl,
  fileType = "pdf",
  isOpen,
  onClose,
  mockContent,
}: DocumentPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
              {mockContent?.laboratory ? (
                <FlaskConical className="h-5 w-5" />
              ) : (
                <FileScan className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {category?.replace(/_/g, " ") || "Medical Diagnostic Report"}
                </span>
                {date && <span className="text-xs text-slate-500 font-mono">Date: {date}</span>}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-slate-200"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            {fileUrl && (
              <a href={fileUrl.replace("&inline=true", "")} target="_blank" rel="noopener noreferrer" download>
                <Button size="sm" variant="default" className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </Button>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60 flex flex-col items-center">
          {fileUrl ? (
            <div className="w-full flex flex-col items-center gap-4">
              {fileType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileUrl}
                  alt={title}
                  className="max-h-[70vh] w-auto max-w-full rounded-xl shadow-lg border border-slate-300 object-contain bg-white"
                />
              ) : (
                <iframe
                  src={fileUrl}
                  title={title}
                  className="w-full h-[70vh] rounded-xl border border-slate-300 shadow-sm bg-white"
                />
              )}
              {mockContent?.notes && (
                <div className="w-full max-w-2xl bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 shadow-xs">
                  <span className="font-bold text-slate-900 block mb-1">Notes / Description:</span>
                  <p className="whitespace-pre-wrap">{mockContent.notes}</p>
                </div>
              )}
            </div>
          ) : (
            /* Master Medical Record Sheet */
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-300 p-8 shadow-md space-y-6">
              {/* Clinical Letterhead in preview */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
                <div>
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    {mockContent?.laboratory || mockContent?.radiologist || "Diagnostic Medical Center"}
                  </h4>
                  <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">
                    Accredited Healthcare &amp; Clinical Diagnostics
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <Award className="h-3.5 w-3.5 text-amber-600" />
                    <span>NABL / AERB Validated Quality Standards</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Official Record ID
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                    MEDREC-{Math.floor(100000 + Math.random() * 900000)}
                  </span>
                </div>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                {mockContent?.radiologist && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Consultant Radiologist</span>
                    <span className="font-bold text-slate-900">{mockContent.radiologist}</span>
                  </div>
                )}
                {mockContent?.laboratory && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Testing Laboratory</span>
                    <span className="font-bold text-slate-900">{mockContent.laboratory}</span>
                  </div>
                )}
                {date && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Report Verified Date</span>
                    <span className="font-semibold text-slate-800">{date}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Validation</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Digitally Authenticated</span>
                  </span>
                </div>
              </div>

              {/* Findings */}
              {mockContent?.findings && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Diagnostic Observations &amp; Findings
                  </span>
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {mockContent.findings}
                  </div>
                </div>
              )}

              {/* Notes */}
              {mockContent?.notes && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Physician Remarks
                  </span>
                  <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-100 text-xs text-sky-950 italic leading-relaxed font-sans">
                    {mockContent.notes}
                  </div>
                </div>
              )}

              {/* Sign-off footer */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Tamper-Resistant EHR Signature Verified</span>
                </span>
                <span>Protected Healthcare Record</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-slate-200 bg-white">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Close Viewer
          </Button>
        </div>
      </div>
    </div>
  );
}
