"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  User,
  Stethoscope,
  Shield,
} from "lucide-react";

type RoleOption = "PATIENT" | "DOCTOR" | "ADMIN";

interface RoleConfig {
  role: RoleOption;
  label: string;
  badge: string;
  phone: string;
  name: string;
  description: string;
  screenPath: string;
  themeColor: string;
  icon: typeof User;
}

const ROLES: Record<RoleOption, RoleConfig> = {
  PATIENT: {
    role: "PATIENT",
    label: "Patient Portal",
    badge: "Patient Account",
    phone: "+91 98765 43210",
    name: "Rohan Verma",
    description: "Access personal health records, radiology scans, laboratory reports & doctor appointments.",
    screenPath: "/dashboard",
    themeColor: "sky",
    icon: User,
  },
  DOCTOR: {
    role: "DOCTOR",
    label: "Doctor Portal",
    badge: "Verified MD Clinician",
    phone: "+91 98200 11223",
    name: "Dr. Aarav Mehta",
    description: "Clinical dashboard, authorized patient list, write & sign e-prescriptions, track appointments.",
    screenPath: "/doctor/dashboard",
    themeColor: "teal",
    icon: Stethoscope,
  },
  ADMIN: {
    role: "ADMIN",
    label: "Admin Portal",
    badge: "Hospital System Admin",
    phone: "+91 90000 00001",
    name: "Platform Administrator",
    description: "Platform oversight, approve doctor practice licenses, audit trail, patient account control.",
    screenPath: "/admin/dashboard",
    themeColor: "purple",
    icon: Shield,
  },
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role")?.toUpperCase();
  const initialRole: RoleOption =
    initialRoleParam === "DOCTOR" || initialRoleParam === "ADMIN" ? initialRoleParam : "PATIENT";

  const [selectedRole, setSelectedRole] = useState<RoleOption>(initialRole);
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConfig = ROLES[selectedRole];

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          password,
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in. Please verify your credentials.");
      }

      window.location.href = data.redirectTo || currentConfig.screenPath;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error signing in";
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
          MedRec Healthcare
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Electronic Health Records &amp; Clinical Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/80 rounded-2xl mb-4 shadow-xs">
          {(Object.keys(ROLES) as RoleOption[]).map((role) => {
            const cfg = ROLES[role];
            const Icon = cfg.icon;
            const isSelected = selectedRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isSelected
                        ? role === "DOCTOR"
                          ? "text-teal-600"
                          : role === "ADMIN"
                          ? "text-purple-600"
                          : "text-sky-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span>{cfg.label.replace(" Portal", "")}</span>
                </div>
              </button>
            );
          })}
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>Sign In</span>
              </CardTitle>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedRole === "DOCTOR"
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : selectedRole === "ADMIN"
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-sky-50 text-sky-700 border border-sky-200"
                }`}
              >
                {currentConfig.badge}
              </span>
            </div>
            <CardDescription className="text-xs text-slate-600 leading-relaxed">
              {currentConfig.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <div className="relative">
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className="pl-10 font-mono text-sm"
                  />
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className={`w-full gap-2 h-11 text-white font-medium shadow-xs ${
                  selectedRole === "DOCTOR"
                    ? "bg-teal-600 hover:bg-teal-700"
                    : selectedRole === "ADMIN"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-sky-600 hover:bg-sky-700"
                }`}
                isLoading={isLoading}
              >
                <span>Sign In to {currentConfig.label}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                Create new account (Sign Up)
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Password secured • RBAC protected • Tamper-resistant signed cookies</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-sky-600 border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
