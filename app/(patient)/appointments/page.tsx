import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, Plus, Clock, MapPin, Video, Stethoscope } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CancelAppointmentButton } from "@/components/appointments/cancel-appointment-button";

export default async function PatientAppointmentsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "PATIENT") redirect("/unauthorized");

  const patient = auth.patientProfile;
  if (!patient) redirect("/login");

  const [appointments, doctors] = await Promise.all([
    medicalRepo.getAppointments(patient.id),
    medicalRepo.getAllDoctors(),
  ]);

  const doctorMap = new Map(doctors.map((d) => [d.id, d]));

  return (
    <AppShell
      userRole="PATIENT"
      userFullName={patient.fullName}
      userIdentifier={patient.patientId}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Clinical Consultations &amp; Appointments
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Manage your upcoming hospital visits, tele-health sessions, and view previous consultation history.
            </p>
          </div>

          <Link href="/appointments/book">
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Book New Consultation</span>
            </Button>
          </Link>
        </div>

        {appointments.length === 0 ? (
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-8">
              <EmptyState
                icon={Calendar}
                title="No Appointments Scheduled"
                description="You do not have any upcoming or past consultation appointments."
                actionLabel="Book a Consultation"
                actionHref="/appointments/book"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
              const doc = doctorMap.get(apt.doctorId);
              const isPast = new Date(apt.appointmentDate).getTime() < Date.now();
              return (
                <Card
                  key={apt.id}
                  className="border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {apt.appointmentNumber}
                        </span>
                        <AppointmentStatusBadge status={apt.status} />
                        <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 flex items-center gap-1">
                          {apt.type === "IN_PERSON" ? (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span>In-Person</span>
                            </>
                          ) : (
                            <>
                              <Video className="h-3 w-3" />
                              <span>Online Video</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">{apt.reasonForVisit}</h3>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {doc?.professionalName} • {doc?.specialty} ({doc?.qualifications})
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(apt.appointmentDate)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{apt.startTime} - {apt.endTime}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {(apt.status === "CONFIRMED" || apt.status === "PENDING") && (
                        <CancelAppointmentButton appointmentId={apt.id} />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
