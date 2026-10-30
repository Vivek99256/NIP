"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MockDoctorProfile } from "@/lib/db/mock-data";
import { bookAppointmentAction } from "@/features/appointments/appointment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Stethoscope, Clock, Calendar, CheckCircle2, AlertCircle, ShieldCheck, Video, MapPin } from "lucide-react";

interface Props {
  doctors: MockDoctorProfile[];
}

const AVAILABLE_SLOTS = [
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
];

export function AppointmentBookingForm({ doctors }: Props) {
  const router = useRouter();
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || "");
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // Default to 2 days ahead
    return d.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("10:00");
  const [type, setType] = useState<"IN_PERSON" | "ONLINE">("IN_PERSON");
  const [reasonForVisit, setReasonForVisit] = useState("Routine consultation and health review");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await bookAppointmentAction({
      doctorId: selectedDoctorId,
      appointmentDate,
      startTime,
      type,
      reasonForVisit,
    });

    setIsLoading(false);
    if (result.success) {
      router.push("/appointments");
    } else {
      setError(result.error || "Failed to book appointment");
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Consultation Details</CardTitle>
        <CardDescription className="text-xs">
          Select attending doctor, format, and clinical symptoms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Select Doctor */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Choose Attending Physician
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map((doc) => {
                const isSelected = doc.id === selectedDoctorId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{doc.professionalName}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          {doc.specialty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{doc.qualifications}</p>
                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">{doc.bio}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono">Reg: {doc.registrationNumber}</span>
                      <span className="font-bold text-slate-900">₹{doc.consultationFee}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Date & Consultation Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="date">2. Consultation Date</Label>
              <Input
                id="date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Consultation Format</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("IN_PERSON")}
                  className={`h-10 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    type === "IN_PERSON"
                      ? "border-sky-600 bg-sky-50 text-sky-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>In-Person Clinic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("ONLINE")}
                  className={`h-10 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    type === "ONLINE"
                      ? "border-sky-600 bg-sky-50 text-sky-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Online Tele-health</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Slot Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Available Time Slots
            </Label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {AVAILABLE_SLOTS.map((slot) => {
                const isSelected = slot === startTime;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setStartTime(slot)}
                    className={`py-2 px-1 text-xs font-mono font-semibold rounded-lg border transition-all text-center ${
                      isSelected
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Reason for Visit */}
          <div className="space-y-1.5">
            <Label htmlFor="reason">4. Reason for Consultation / Symptoms</Label>
            <textarea
              id="reason"
              rows={3}
              required
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="Describe your symptoms, medical concerns, or follow-up goals..."
              className="flex w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            />
          </div>

          {/* Double-Booking Safety Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Real-time slot lock prevents double bookings. Appointment confirmed immediately upon submission.
            </span>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" isLoading={isLoading} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm &amp; Book Appointment</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
