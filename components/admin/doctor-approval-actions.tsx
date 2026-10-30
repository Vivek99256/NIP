"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateDoctorVerificationAction } from "@/features/admin/admin-actions";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export function DoctorApprovalActions({ doctorId }: { doctorId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDecision = async (status: "APPROVED" | "REJECTED" | "SUSPENDED") => {
    setIsLoading(true);
    const result = await updateDoctorVerificationAction(doctorId, status);
    setIsLoading(false);
    if (!result.success) {
      alert(result.error || "Action failed");
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        size="sm"
        variant="teal"
        onClick={() => handleDecision("APPROVED")}
        isLoading={isLoading}
        className="h-8 text-xs gap-1"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Approve</span>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleDecision("REJECTED")}
        isLoading={isLoading}
        className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
      >
        <XCircle className="h-3.5 w-3.5" />
        <span>Reject</span>
      </Button>
    </div>
  );
}
