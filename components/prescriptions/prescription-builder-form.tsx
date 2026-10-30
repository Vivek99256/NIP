"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MockPatientProfile } from "@/lib/db/mock-data";
import { createPrescriptionDraftAction, finalizePrescriptionAction } from "@/features/prescriptions/prescription-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Pill, Plus, Trash2, CheckCircle2, AlertCircle, Save, ShieldCheck } from "lucide-react";

interface MedicineRow {
  medicineName: string;
  strength: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Props {
  patients: MockPatientProfile[];
  defaultPatientId?: string;
  doctorName: string;
  registrationNumber: string;
}

export function PrescriptionBuilderForm({
  patients,
  defaultPatientId,
  doctorName,
  registrationNumber,
}: Props) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(defaultPatientId || patients[0]?.id || "");
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    {
      medicineName: "",
      strength: "500 mg",
      dosage: "1 tablet",
      route: "Oral",
      frequency: "Twice daily after meals",
      duration: "5 days",
      instructions: "Take with warm water",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.id === patientId);

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicineName: "",
        strength: "",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "5 days",
        instructions: "",
      },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    if (medicines.length <= 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof MedicineRow, value: string) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (finalizeImmediately: boolean) => {
    setError(null);
    if (!diagnosis.trim()) {
      setError("Please specify a clinical diagnosis");
      return;
    }

    if (medicines.some((m) => !m.medicineName.trim())) {
      setError("All medicine entries must have a valid medicine name");
      return;
    }

    setIsLoading(true);

    const draftResult = await createPrescriptionDraftAction({
      patientId,
      diagnosis,
      clinicalNotes,
      followUpDate: followUpDate || undefined,
      medicines,
    });

    if (!draftResult.success || !draftResult.prescription) {
      setIsLoading(false);
      setError(draftResult.error || "Failed to create prescription");
      return;
    }

    if (finalizeImmediately) {
      const finalizeResult = await finalizePrescriptionAction(draftResult.prescription.id);
      setIsLoading(false);
      if (!finalizeResult.success) {
        setError(finalizeResult.error || "Created draft, but failed to finalize");
        return;
      }
    } else {
      setIsLoading(false);
    }

    router.push("/doctor/prescriptions");
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Electronic Prescription Order</CardTitle>
        <CardDescription className="text-xs">
          Prescribing Clinician: <strong>{doctorName}</strong> (Reg: {registrationNumber})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Selection & Demographics Preview */}
        <div className="space-y-2">
          <Label htmlFor="patientSelect">Select Authorized Patient</Label>
          <select
            id="patientSelect"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.patientId}) - Blood: {p.bloodGroup}
              </option>
            ))}
          </select>

          {selectedPatient?.allergies && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 mt-2">
              <strong>⚠️ Allergies Warning:</strong> {selectedPatient.allergies}
            </div>
          )}
        </div>

        {/* Diagnosis & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="diagnosis">Clinical Diagnosis *</Label>
            <Input
              id="diagnosis"
              required
              placeholder="e.g. Acute Pharyngitis with viral fever"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="followUp">Recommended Follow-up Date (Optional)</Label>
            <Input
              id="followUp"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
        </div>

        {/* Medicine Entries Builder */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Prescribed Medicines &amp; Dosing Schedules
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedicine}
              className="gap-1.5 text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Medicine</span>
            </Button>
          </div>

          <div className="space-y-4">
            {medicines.map((m, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 font-mono">
                    Medicine #{index + 1}
                  </span>
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(index)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Medicine Brand / Generic Name *</Label>
                    <Input
                      placeholder="e.g. Amoxicillin + Clavulanic"
                      value={m.medicineName}
                      onChange={(e) => handleMedicineChange(index, "medicineName", e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Strength *</Label>
                    <Input
                      placeholder="e.g. 625 mg"
                      value={m.strength}
                      onChange={(e) => handleMedicineChange(index, "strength", e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Dosage Form *</Label>
                    <Input
                      placeholder="e.g. 1 tablet / 5 ml syrup"
                      value={m.dosage}
                      onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Route</Label>
                    <select
                      value={m.route}
                      onChange={(e) => handleMedicineChange(index, "route", e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="Oral">Oral</option>
                      <option value="Topical">Topical</option>
                      <option value="Inhalation">Inhalation</option>
                      <option value="Intravenous">Intravenous (IV)</option>
                      <option value="Sublingual">Sublingual</option>
                      <option value="Ophthalmic">Eye Drops (Ophthalmic)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Frequency *</Label>
                    <Input
                      placeholder="e.g. Twice daily after meals"
                      value={m.frequency}
                      onChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Duration *</Label>
                    <Input
                      placeholder="e.g. 5 days / 1 month"
                      value={m.duration}
                      onChange={(e) => handleMedicineChange(index, "duration", e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Instructions</Label>
                    <Input
                      placeholder="e.g. Take with food"
                      value={m.instructions}
                      onChange={(e) => handleMedicineChange(index, "instructions", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Advice / Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="clinicalNotes">Clinical Advice &amp; Lifestyle Instructions</Label>
          <textarea
            id="clinicalNotes"
            rows={3}
            placeholder="Hydration guidelines, bed rest, dietary restrictions, warning signs..."
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            className="flex w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          />
        </div>

        {/* Submission Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Finalizing generates an immutable signed prescription.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleSubmit(false)}
              className="text-xs gap-1.5 flex-1 sm:flex-none"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </Button>

            <Button
              type="button"
              variant="teal"
              disabled={isLoading}
              onClick={() => handleSubmit(true)}
              className="text-xs gap-1.5 flex-1 sm:flex-none"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Finalize &amp; Sign</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
