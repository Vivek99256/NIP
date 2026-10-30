"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientProfileUpdateSchema } from "@/lib/validation/schemas";
import { updatePatientProfileAction } from "@/features/patients/patient-actions";
import { MockPatientProfile } from "@/lib/db/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Save, Lock } from "lucide-react";

interface PatientProfileFormProps {
  patient: MockPatientProfile;
  verifiedMobile: string;
}

export function PatientProfileForm({ patient, verifiedMobile }: PatientProfileFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientProfileUpdateSchema),
    defaultValues: {
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "",
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      emergencyContactName: patient.emergencyContactName || "",
      emergencyContactPhone: patient.emergencyContactPhone || "",
      address: patient.address || "",
      allergies: patient.allergies || "",
      existingConditions: patient.existingConditions || "",
    },
  });

  const onSubmit = async (values: any) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const result = await updatePatientProfileAction(patient.id, values);
    if (result.success) {
      setSuccessMessage("Your medical profile details were saved successfully.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setErrorMessage(result.error || "Failed to update profile.");
    }
  };

  return (
    <Card className="shadow-xs border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Medical Record Demographics</CardTitle>
        <CardDescription className="text-xs">
          Your attending physicians use these details during treatment and prescribing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <div className="mb-6 flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Read-only Security Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                <span>Patient Identifier (Permanent)</span>
              </Label>
              <Input value={patient.patientId} disabled className="bg-slate-100 font-mono text-xs font-bold" />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                <span>Verified Mobile Number</span>
              </Label>
              <Input value={verifiedMobile} disabled className="bg-slate-100 font-mono text-xs" />
            </div>
          </div>

          {/* Demographic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-rose-600">{errors.fullName.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                {...register("gender")}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <option value="NOT_DISCLOSED">Prefer not to disclose</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <select
                id="bloodGroup"
                {...register("bloodGroup")}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <option value="UNKNOWN">Unknown / Not Tested</option>
                <option value="A_POSITIVE">A Positive (A+)</option>
                <option value="A_NEGATIVE">A Negative (A-)</option>
                <option value="B_POSITIVE">B Positive (B+)</option>
                <option value="B_NEGATIVE">B Negative (B-)</option>
                <option value="AB_POSITIVE">AB Positive (AB+)</option>
                <option value="AB_NEGATIVE">AB Negative (AB-)</option>
                <option value="O_POSITIVE">O Positive (O+)</option>
                <option value="O_NEGATIVE">O Negative (O-)</option>
              </select>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Emergency Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="emergencyContactName">Contact Name &amp; Relation</Label>
                <Input
                  id="emergencyContactName"
                  placeholder="e.g. Meera Verma (Spouse)"
                  {...register("emergencyContactName")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emergencyContactPhone">Contact Phone Number</Label>
                <Input
                  id="emergencyContactPhone"
                  placeholder="+91 98765 00000"
                  {...register("emergencyContactPhone")}
                />
              </div>
            </div>
          </div>

          {/* Critical Medical History & Allergies */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="allergies" className="text-rose-700 font-semibold">
                ⚠️ Known Allergies (Drugs, Foods, Contrast Agents)
              </Label>
              <textarea
                id="allergies"
                rows={2}
                placeholder="e.g. Penicillin, Sulfa drugs, Peanuts, Iodine contrast"
                {...register("allergies")}
                className="flex w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="existingConditions">Existing Medical Conditions &amp; Diagnoses</Label>
              <textarea
                id="existingConditions"
                rows={3}
                placeholder="e.g. Hypertension, Asthma, Type 2 Diabetes, Past surgeries"
                {...register("existingConditions")}
                className="flex w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Residential Address</Label>
              <Input id="address" placeholder="Flat, Street, City, State, PIN" {...register("address")} />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" isLoading={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              <span>Save Profile Changes</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
