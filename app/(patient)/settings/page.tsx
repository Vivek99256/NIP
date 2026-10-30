import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, ShieldCheck, Bell, Lock, Smartphone, LogOut } from "lucide-react";

export default async function SettingsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  return (
    <AppShell
      userRole={auth.user.role}
      userFullName={auth.patientProfile?.fullName || auth.doctorProfile?.professionalName || "Administrator"}
      userIdentifier={auth.patientProfile?.patientId || auth.doctorProfile?.registrationNumber}
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Account &amp; Security Settings
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your verified authentication credentials, alerts, and active login sessions.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Authentication Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Authentication Credentials</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Your account utilizes passwordless cryptographic mobile one-time verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="font-bold text-slate-900 text-sm font-mono">{auth.user.mobileNumber}</p>
                  <p className="text-slate-500 text-[11px]">Primary verified telephone number for OTP challenges</p>
                </div>
              </div>
              <Badge variant="success">Verified</Badge>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">Session Security</p>
                  <p className="text-slate-500 text-[11px]">Encrypted HttpOnly, SameSite cookies with HMAC signature</p>
                </div>
              </div>
              <Badge variant="teal">Active (TLS Protected)</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-sky-600" />
              <span>Clinical Notification Preferences</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Configure how you receive clinical alerts, lab releases, and appointment confirmations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
              <div>
                <p className="font-semibold text-slate-900">SMS Appointment Confirmations</p>
                <p className="text-slate-500 text-[11px]">Receive booking updates and clinic schedule reminders via SMS</p>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Enabled</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
              <div>
                <p className="font-semibold text-slate-900">Laboratory &amp; Radiology Release Notifications</p>
                <p className="text-slate-500 text-[11px]">Instant alert when a pathologist or radiologist verifies your report</p>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Enabled</span>
            </div>
          </CardContent>
        </Card>

        {/* Session Termination */}
        <div className="flex justify-end">
          <form action="/api/auth/logout" method="POST">
            <Button variant="destructive" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sign Out of All Sessions</span>
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
