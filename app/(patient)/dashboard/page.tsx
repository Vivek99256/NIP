import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { calculateProfileCompletion } from "@/features/patients/patient-utils";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BloodGroupBadge, AppointmentStatusBadge, PrescriptionStatusBadge } from "@/components/shared/status-badge";
import {
  FileScan,
  FlaskConical,
  Pill,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  Plus,
  Clock,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function PatientDashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "PATIENT") {
    if (auth.user.role === "DOCTOR") redirect("/doctor/dashboard");
    if (auth.user.role === "ADMIN") redirect("/admin/dashboard");
  }

  const patient = auth.patientProfile;
  if (!patient) redirect("/profile");

  // Fetch patient medical data
  const [radiologyList, labList, rxList, appointments] = await Promise.all([
    medicalRepo.getRadiologyReports(patient.id),
    medicalRepo.getLaboratoryReports(patient.id),
    medicalRepo.getPrescriptions(patient.id),
    medicalRepo.getAppointments(patient.id),
  ]);

  const upcomingAppointment = appointments.find(
    (a) => a.status === "CONFIRMED" || a.status === "PENDING"
  );

  const completion = calculateProfileCompletion(patient);

  return (
    <AppShell
      userRole="PATIENT"
      userFullName={patient.fullName}
      userIdentifier={patient.patientId}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {patient.fullName}
              </h1>
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                {patient.patientId}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Access your radiology imaging, structured laboratory results, and electronic prescriptions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/appointments/book">
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>Book Appointment</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Completion Alert if incomplete */}
        {completion.percentage < 100 && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-950">
                  Profile is {completion.percentage}% Complete
                </p>
                <p className="text-xs text-amber-800">
                  Missing: {completion.missingFields.slice(0, 3).join(", ")}
                </p>
              </div>
            </div>
            <Link href="/profile">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100">
                Complete Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Radiology Reports"
            value={radiologyList.length}
            description="X-Ray, CT, MRI & Ultrasound"
            icon={FileScan}
            colorScheme="sky"
          />
          <StatCard
            title="Laboratory Reports"
            value={labList.length}
            description="CBC, LFT, KFT & Blood Sugar"
            icon={FlaskConical}
            colorScheme="teal"
          />
          <StatCard
            title="Prescriptions"
            value={rxList.length}
            description="Official clinician orders"
            icon={Pill}
            colorScheme="indigo"
          />
          <StatCard
            title="Appointments"
            value={appointments.length}
            description={upcomingAppointment ? "1 upcoming" : "No active bookings"}
            icon={Calendar}
            colorScheme="emerald"
          />
        </div>

        {/* Main Grid: Clinical Summary & Upcoming Appointment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medical Summary Card */}
          <Card className="lg:col-span-1 shadow-xs border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Medical Summary</span>
                <BloodGroupBadge bloodGroup={patient.bloodGroup} />
              </CardTitle>
              <CardDescription className="text-xs">Crucial medical alerts and baseline history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200">
                <span className="font-bold text-rose-900 block mb-1">⚠️ Known Allergies:</span>
                <p className="text-rose-800 leading-relaxed font-medium">
                  {patient.allergies || "No drug or food allergies on record."}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Pre-existing Conditions:</span>
                <p className="text-slate-600 leading-relaxed">
                  {patient.existingConditions || "None declared."}
                </p>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender:</span>
                  <span className="font-semibold text-slate-800">{patient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Contact:</span>
                  <span className="font-semibold text-slate-800">
                    {patient.emergencyContactName || "Not set"} ({patient.emergencyContactPhone || "N/A"})
                  </span>
                </div>
              </div>

              <Link href="/profile" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Edit Medical Details
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Appointment & Recent Care */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointment Banner */}
            {upcomingAppointment ? (
              <Card className="border-sky-200 bg-gradient-to-r from-sky-50/80 via-white to-slate-50 shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-sky-600" />
                      <span>Next Scheduled Consultation</span>
                    </span>
                    <AppointmentStatusBadge status={upcomingAppointment.status} />
                  </div>
                  <CardTitle className="text-lg mt-1">{upcomingAppointment.reasonForVisit}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Date &amp; Slot:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatDate(upcomingAppointment.appointmentDate)} at {upcomingAppointment.startTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Consultation Type:</span>
                      <span className="font-semibold text-slate-800">
                        {upcomingAppointment.type === "IN_PERSON" ? "In-Person Clinic Visit" : "Online Video Consultation"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex justify-end">
                    <Link href="/appointments">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        <span>Manage Appointments</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">No Upcoming Appointments</CardTitle>
                  <CardDescription className="text-xs">Schedule a visit with your primary doctor or specialist.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/appointments/book">
                    <Button size="sm" className="gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Find a Doctor &amp; Book Slot</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Recent Prescriptions Preview */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Prescriptions</CardTitle>
                  <CardDescription className="text-xs">Latest medicines prescribed by your doctors</CardDescription>
                </div>
                <Link href="/prescriptions">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    <span>View All</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {rxList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No prescriptions on record.</p>
                ) : (
                  <div className="space-y-3">
                    {rxList.slice(0, 2).map((rx) => (
                      <div
                        key={rx.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-800">{rx.prescriptionNumber}</span>
                            <PrescriptionStatusBadge status={rx.status} />
                          </div>
                          <p className="text-xs font-semibold text-slate-900 mt-1">{rx.diagnosis}</p>
                          <p className="text-[11px] text-slate-500">{rx.medicines.length} medicine(s) prescribed</p>
                        </div>
                        <Link href={`/prescriptions/${rx.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            View Prescription
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
