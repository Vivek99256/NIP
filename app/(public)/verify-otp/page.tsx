"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, KeyRound, ArrowRight, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone") || "";

  const [mobileNumber, setMobileNumber] = useState(phoneParam);
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedMobile = sessionStorage.getItem("medrec_auth_mobile") || phoneParam;
    if (storedMobile) setMobileNumber(storedMobile);

    const storedRole = sessionStorage.getItem("medrec_auth_role");
    if (storedRole) setRole(storedRole);

    const storedDevOtp = sessionStorage.getItem("medrec_dev_otp");
    if (storedDevOtp) {
      setDevOtp(storedDevOtp);
      setOtp(storedDevOtp); // Auto-fill for testing convenience
    } else if (storedMobile) {
      // Attempt to retrieve pending code from dev store
      fetch(`/api/auth/dev-peek-otp?mobileNumber=${encodeURIComponent(storedMobile)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.otp) {
            setDevOtp(data.otp);
            setOtp(data.otp);
          }
        })
        .catch(() => {});
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [phoneParam]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          otp,
          fullName: isNewPatient ? fullName : undefined,
          role: role || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      sessionStorage.removeItem("medrec_dev_otp");
      router.push(data.redirectTo || "/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");

      setResendCooldown(data.resendAfterSeconds || 60);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setOtp(data.devOtp);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-sky-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md">
          <Activity className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Verify Security Code
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-mono">
          Sent to {mobileNumber || "your mobile number"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Enter 6-Digit Passcode</CardTitle>
              {role && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    role === "DOCTOR"
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : role === "ADMIN"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-sky-50 text-sky-700 border border-sky-200"
                  }`}
                >
                  {role} Portal
                </span>
              )}
            </div>
            <CardDescription className="text-xs">
              Check your SMS notifications for the one-time code to access {role ? `${role.toLowerCase()} features` : "your portal"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {devOtp ? (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-950 text-xs shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Development Mode OTP:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtp)}
                    className="px-2.5 py-1 bg-amber-200/90 hover:bg-amber-300 text-amber-900 rounded-lg font-bold text-[11px] transition-colors"
                  >
                    Auto-Fill Code
                  </button>
                </div>
                <div className="font-mono text-center py-2 px-3 bg-white/80 rounded-lg border border-amber-200/70 text-2xl font-black tracking-widest text-slate-900 select-all">
                  {devOtp}
                </div>
                <p className="mt-2 text-[11px] text-amber-800/90 leading-relaxed">
                  <strong>Notice:</strong> As this is running on Localhost with <code>SMS_PROVIDER=&quot;MOCK&quot;</code>, a physical SMS is not sent to your telecom SIM card. The OTP is generated right here for instant testing!
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                <p className="font-semibold text-slate-900 mb-1">ℹ️ Local Testing Notice:</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  SMS is not sent to physical phones because <code>SMS_PROVIDER</code> is in Mock mode. You can check your VS Code terminal running <code>npm run dev</code> for the code, or click <strong>Resend Code</strong> below.
                </p>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Passcode</Label>
                <div className="relative">
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    className="pl-10 text-center font-mono text-xl tracking-widest font-bold h-12"
                  />
                  <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                </div>
              </div>

              {isNewPatient && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Label htmlFor="fullName">Full Name (New Patient Registration)</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full gap-2 h-11" isLoading={isLoading}>
                <span>Verify &amp; Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link href="/login" className="flex items-center gap-1 hover:text-slate-800">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change Number</span>
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="flex items-center gap-1.5 text-sky-600 hover:text-sky-700 disabled:text-slate-400 disabled:pointer-events-none font-medium"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-sky-600 border-t-transparent" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
