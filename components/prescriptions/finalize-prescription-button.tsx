"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { finalizePrescriptionAction } from "@/features/prescriptions/prescription-actions";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function FinalizePrescriptionButton({ prescriptionId }: { prescriptionId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinalize = async () => {
    if (!confirm("Are you sure you want to finalize this prescription? Once finalized, it becomes an official medical record and cannot be silently edited.")) {
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await finalizePrescriptionAction(prescriptionId);
    setIsLoading(false);

    if (!result.success) {
      alert(result.error || "Failed to finalize prescription");
    }
  };

  return (
    <Button
      size="sm"
      variant="teal"
      onClick={handleFinalize}
      isLoading={isLoading}
      className="h-8 text-xs gap-1"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span>Finalize</span>
    </Button>
  );
}
