"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MockAppointment } from "@/lib/db/mock-data";
import { updateAppointmentStatusAction } from "@/features/appointments/appointment-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { AppointmentStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, CheckCircle, XCircle, Clock, MapPin, Video, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EnrichedAppointment extends MockAppointment {
  patientName: string;
  patientCode: string;
}

interface Props {
  initialAppointments: EnrichedAppointment[];
}

export function DoctorAppointmentManager({ initialAppointments }: Props) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED") => {
    setLoadingId(id);
    const result = await updateAppointmentStatusAction(id, status);
    setLoadingId(null);
    if (result.success && result.appointment) {
      setAppointments(
        appointments.map((a) => (a.id === id ? { ...a, status: result.appointment!.status } : a))
      );
    }
  };

  const filtered = appointments.filter((a) => {
    if (statusFilter === "ALL") return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === status
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Calendar}
                title="No Appointments Found"
                description="No assigned appointments matched the selected status filter."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Appointment Code</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Reason for Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {apt.appointmentNumber}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/doctor/patients/${apt.patientId}`}
                        className="font-bold text-xs text-sky-700 hover:underline flex items-center gap-1"
                      >
                        <span>{apt.patientName}</span>
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono block">{apt.patientCode}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-mono">
                      {formatDate(apt.appointmentDate)} at {apt.startTime}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {apt.type === "IN_PERSON" ? "In-Person Clinic" : "Online Video"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                      {apt.reasonForVisit}
                    </TableCell>
                    <TableCell>
                      <AppointmentStatusBadge status={apt.status} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {apt.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="teal"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleUpdateStatus(apt.id, "CONFIRMED")}
                          isLoading={loadingId === apt.id}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Confirm</span>
                        </Button>
                      )}
                      {apt.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleUpdateStatus(apt.id, "COMPLETED")}
                          isLoading={loadingId === apt.id}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Mark Completed</span>
                        </Button>
                      )}
                      {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleUpdateStatus(apt.id, "CANCELLED")}
                          isLoading={loadingId === apt.id}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Cancel</span>
                        </Button>
                      )}
                      <Link href={`/doctor/patients/${apt.patientId}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          Chart
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
