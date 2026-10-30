import React from "react";
import { Badge } from "@/components/ui/badge";

export function AppointmentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "CONFIRMED":
      return <Badge variant="success">Confirmed</Badge>;
    case "COMPLETED":
      return <Badge variant="default">Completed</Badge>;
    case "PENDING":
      return <Badge variant="warning">Pending Approval</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Cancelled</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Declined</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function PrescriptionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "FINALIZED":
      return <Badge variant="success">Finalized (Official)</Badge>;
    case "AMENDED":
      return <Badge variant="teal">Amended (Revised)</Badge>;
    case "DRAFT":
      return <Badge variant="warning">Draft (Unsigned)</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function DoctorStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "APPROVED":
      return <Badge variant="success">Verified & Active</Badge>;
    case "PENDING":
      return <Badge variant="warning">Pending Verification</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function AbnormalityFlagBadge({ flag }: { flag: string }) {
  switch (flag) {
    case "NORMAL":
      return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Normal</span>;
    case "HIGH":
      return <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">High ↑</span>;
    case "LOW":
      return <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Low ↓</span>;
    case "CRITICAL":
      return <span className="text-xs font-bold text-red-900 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300 animate-pulse">Critical ⚠</span>;
    case "ABNORMAL":
      return <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">Abnormal</span>;
    default:
      return <span className="text-xs text-slate-600">{flag}</span>;
  }
}

export function BloodGroupBadge({ bloodGroup }: { bloodGroup: string }) {
  const display = bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
      🩸 {display}
    </span>
  );
}
