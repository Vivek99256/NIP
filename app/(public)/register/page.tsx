"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Activity,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  Stethoscope,
  Shield,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type RoleOption = "PATIENT" | "DOCTOR" | "ADMIN";

function RegisterContent() {
  const router = useRouter();

  const [role, setRole] = useState<RoleOption>("PATIENT");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [specialty, setSpecialty] = useState("General Medicine");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          mobileNumber,
          password,
          role,
          specialty: role === "DOCTOR" ? specialty : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      // Hard redirect to load dashboard
      window.location.href =
        data.redirectTo ||
        (role === "DOCTOR"
          ? "/doctor/dashboard"
          : role === "ADMIN"
          ? "/admin/dashboard"
          : "/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error creating account";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-sky-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md">
          <Activity className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Create NIP Healthcare Account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Sign up to access medical records and clinical services
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/80 rounded-2xl mb-4 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setRole("PATIENT");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              role === "PATIENT"
                ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <User className={`h-4 w-4 ${role === "PATIENT" ? "text-sky-600" : "text-slate-400"}`} />
            <span>Patient</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("DOCTOR");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              role === "DOCTOR"
                ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Stethoscope className={`h-4 w-4 ${role === "DOCTOR" ? "text-teal-600" : "text-slate-400"}`} />
            <span>Doctor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("ADMIN");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              role === "ADMIN"
                ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Shield className={`h-4 w-4 ${role === "ADMIN" ? "text-purple-600" : "text-slate-400"}`} />
            <span>Admin</span>
          </button>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                <span>
                  Sign Up as{" "}
                  {role === "DOCTOR"
                    ? "Doctor"
                    : role === "ADMIN"
                    ? "Hospital Admin"
                    : "Patient"}
                </span>
              </CardTitle>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  role === "DOCTOR"
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : role === "ADMIN"
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-sky-50 text-sky-700 border border-sky-200"
                }`}
              >
                {role === "DOCTOR"
                  ? "Clinical License"
                  : role === "ADMIN"
                  ? "Hospital Admin"
                  : "Personal Records"}
              </span>
            </div>
            <CardDescription className="text-xs text-slate-600">
              {role === "DOCTOR"
                ? "Register verified clinician account to write e-prescriptions & review patient labs."
                : role === "ADMIN"
                ? "Register hospital system administrator to manage clinical operations, staff & audit trail."
                : "Register patient account to manage health records, lab reports & medical documents."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder={
                      role === "DOCTOR"
                        ? "Dr. Rajesh Sharma"
                        : role === "ADMIN"
                        ? "Admin Full Name"
                        : "Rajesh Sharma"
                    }
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10 text-sm"
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mobileNumber">Mobile Number (with Country Code)</Label>
                <div className="relative">
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className="pl-10 font-mono text-sm"
                  />
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {role === "DOCTOR" && (
                <div className="space-y-1.5">
                  <Label htmlFor="specialty">Medical Specialty</Label>
                  <Input
                    id="specialty"
                    name="specialty"
                    type="text"
                    placeholder="e.g. General Medicine, Cardiology, Pediatrics"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    required
                    className="text-sm"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-[11px] text-slate-400">Min 6 characters</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 text-sm"
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 text-sm"
                  />
                  <CheckCircle2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className={`w-full gap-2 h-11 text-white font-medium shadow-xs ${
                  role === "DOCTOR"
                    ? "bg-teal-600 hover:bg-teal-700"
                    : role === "ADMIN"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-sky-600 hover:bg-sky-700"
                }`}
                isLoading={isLoading}
              >
                <span>
                  Create{" "}
                  {role === "DOCTOR"
                    ? "Doctor"
                    : role === "ADMIN"
                    ? "Admin"
                    : "Patient"}{" "}
                  Account
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                Sign In here
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Password encrypted • Tamper-resistant session isolation</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-sky-600 border-t-transparent" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

