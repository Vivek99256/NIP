"use client";

import React, { useState } from "react";
import { MockAppointment, MockDoctorProfile, MockPatientProfile } from "@/lib/db/mock-data";
import { adminUpdateAppointmentStatusAction } from "@/features/admin/admin-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { AppointmentStatusBadge } from "@/components/shared/status-badge";
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Video,
  User,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  initialAppointments: MockAppointment[];
  patients: MockPatientProfile[];
  doctors: MockDoctorProfile[];
}

export function AdminAppointmentsManager({ initialAppointments, patients, doctors }: Props) {
  const [appointments, setAppointments] = useState<MockAppointment[]>(initialAppointments);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const doctorMap = new Map(doctors.map((d) => [d.id, d]));

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === "ALL" || apt.status === statusFilter;
    const patName = patientMap.get(apt.patientId)?.fullName.toLowerCase() || "";
    const docName = doctorMap.get(apt.doctorId)?.professionalName.toLowerCase() || "";
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      apt.appointmentNumber.toLowerCase().includes(q) ||
      patName.includes(q) ||
      docName.includes(q) ||
      apt.reasonForVisit.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (
    appointmentId: string,
    status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED"
  ) => {
    let cancellationReason: string | undefined = undefined;
    if (status === "CANCELLED" || status === "REJECTED") {
      const reason = window.prompt("Please enter the operational reason for cancellation / rejection:");
      if (!reason) return;
      cancellationReason = reason;
    }

    setLoadingId(appointmentId);
    const res = await adminUpdateAppointmentStatusAction(appointmentId, status, cancellationReason);
    setLoadingId(null);

    if (res.success && res.appointment) {
      setAppointments(
        appointments.map((a) => (a.id === appointmentId ? res.appointment! : a))
      );
      toast.success(`Appointment status updated to ${status}`);
    } else {
      toast.error(res.error || "Failed to update appointment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                System-Wide Appointments &amp; Schedules
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Full CRUD control: Monitor hospital-wide booking slots, confirm sessions, complete visits, or cancel appointments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl w-fit">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search booking ref, patient, doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Appointments Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Ref</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Attending Doctor</TableHead>
                <TableHead>Date &amp; Slot</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason for Visit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Administration Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((apt) => {
                const pat = patientMap.get(apt.patientId);
                const doc = doctorMap.get(apt.doctorId);
                return (
                  <TableRow key={apt.id}>
                    <TableCell className="font-mono text-xs font-bold text-sky-800">
                      {apt.appointmentNumber}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-slate-900">
                      {pat?.fullName || "Patient"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-semibold">
                      {doc?.professionalName || "Physician"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-mono">
                      <span>{formatDate(apt.appointmentDate)}</span>
                      <span className="block text-[11px] text-slate-400 font-sans">
                        {apt.startTime} - {apt.endTime}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                        {apt.type === "ONLINE" ? (
                          <>
                            <Video className="h-3 w-3 text-purple-600" />
                            <span>Online</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-3 w-3 text-emerald-600" />
                            <span>In-Person</span>
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                      {apt.reasonForVisit}
                    </TableCell>
                    <TableCell>
                      <AppointmentStatusBadge status={apt.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="teal"
                            onClick={() => handleUpdateStatus(apt.id, "CONFIRMED")}
                            isLoading={loadingId === apt.id}
                            className="h-7 text-xs gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Confirm</span>
                          </Button>
                        )}

                        {apt.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdateStatus(apt.id, "COMPLETED")}
                            isLoading={loadingId === apt.id}
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Complete</span>
                          </Button>
                        )}

                        {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(apt.id, "CANCELLED")}
                            isLoading={loadingId === apt.id}
                            className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Cancel</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    No appointment records found matching current query.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
