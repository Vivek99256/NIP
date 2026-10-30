"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateAppointmentStatusAction } from "@/features/appointments/appointment-actions";
import { X, AlertCircle } from "lucide-react";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("Patient schedule conflict");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);
    const result = await updateAppointmentStatusAction(appointmentId, "CANCELLED", reason);
    setIsLoading(false);
    if (result.success) {
      setIsOpen(false);
    } else {
      setError(result.error || "Failed to cancel appointment");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
      >
        Cancel
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Cancel Appointment</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to cancel this scheduled consultation? The reserved slot will be released back to the clinic.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-700">Reason for Cancellation</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            {error && (
              <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Keep Appointment
              </Button>
              <Button size="sm" variant="destructive" onClick={handleCancel} isLoading={isLoading}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
