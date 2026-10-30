import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Cloud, MessageSquare, ShieldCheck, Server } from "lucide-react";

export default async function AdminSettingsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "ADMIN") redirect("/unauthorized");

  return (
    <AppShell
      userRole="ADMIN"
      userFullName="Platform Administrator"
      userIdentifier="ADMIN-ROOT"
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                System Infrastructure &amp; Environment
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Active provider adapters, database persistence status, and security compliance configuration.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Configuration */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-sky-600" />
                  <span>Database Layer</span>
                </span>
                <Badge variant="teal">PostgreSQL / Prisma ORM</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ORM Framework:</span>
                <span className="font-mono font-semibold text-slate-800">Prisma Client 5.22.0</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-semibold text-slate-800">PostgreSQL (Relational)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Schema Migrations:</span>
                <span className="font-mono text-emerald-700 font-semibold">20261026000000_init</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Data Isolation:</span>
                <span className="font-semibold text-slate-800">Row-level &amp; Role-enforced</span>
              </div>
            </CardContent>
          </Card>

          {/* SMS & OTP Adapter */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  <span>SMS Delivery Provider</span>
                </span>
                <Badge variant="success">Adapter Interface</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Configured Provider:</span>
                <span className="font-mono font-semibold text-slate-800">{process.env.SMS_PROVIDER || "MOCK"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">OTP Challenge Expiry:</span>
                <span className="font-mono text-slate-800">{process.env.OTP_EXPIRY_SECONDS || "300"} seconds</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Resend Cooldown:</span>
                <span className="font-mono text-slate-800">{process.env.OTP_RESEND_COOLDOWN_SECONDS || "60"} seconds</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Storage Format:</span>
                <span className="font-semibold text-slate-800">HMAC-SHA256 (Salted)</span>
              </div>
            </CardContent>
          </Card>

          {/* Private Object Storage */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-indigo-600" />
                  <span>File Storage Layer</span>
                </span>
                <Badge variant="purple">Private Storage</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Storage Provider:</span>
                <span className="font-mono font-semibold text-slate-800">{process.env.STORAGE_PROVIDER || "LOCAL"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Maximum Upload Limit:</span>
                <span className="font-mono text-slate-800">15 MB per file</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">MIME Type Allowlist:</span>
                <span className="font-mono text-slate-800">PDF, JPEG, PNG, WEBP</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Object Key Generation:</span>
                <span className="font-semibold text-slate-800">Server-side UUID (Non-guessable)</span>
              </div>
            </CardContent>
          </Card>

          {/* Security & Audit Policies */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  <span>Security &amp; Privacy Policies</span>
                </span>
                <Badge variant="teal">HIPAA / GDPR Ready</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Admin Clinical Data Segregation:</span>
                <span className="text-emerald-700 font-semibold">Strictly Enforced</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Prescription Immutability:</span>
                <span className="text-emerald-700 font-semibold">Versioned Amendments Only</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Double-Booking Guard:</span>
                <span className="text-emerald-700 font-semibold">Transactional Slot Lock</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Audit Logging:</span>
                <span className="text-emerald-700 font-semibold">Sanitized (Zero-PHI plaintext)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
