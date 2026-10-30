"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Stethoscope, ShieldCheck, RefreshCw, ChevronUp, ChevronDown, Sparkles } from "lucide-react";

interface RoleSwitcherProps {
  currentRole?: "PATIENT" | "DOCTOR" | "ADMIN";
}

export function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Detect current role from prop or URL
  const activeRole =
    currentRole ||
    (pathname.startsWith("/admin")
      ? "ADMIN"
      : pathname.startsWith("/doctor")
      ? "DOCTOR"
      : pathname.startsWith("/login") || pathname.startsWith("/verify-otp") || pathname === "/"
      ? undefined
      : "PATIENT");

  const handleSwitchRole = async (targetRole: "PATIENT" | "DOCTOR" | "ADMIN") => {
    try {
      setIsSwitching(targetRole);
      const res = await fetch("/api/auth/dev-switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to switch role");

      // Hard redirect to clear any state and load role layout
      window.location.href = data.redirectTo;
    } catch (err) {
      console.error("Role switch error:", err);
      setIsSwitching(null);
    }
  };

  return (
    <aside
      aria-label="Role Switcher"
      className="fixed bottom-4 right-4 z-50 print:hidden font-sans"
    >
      <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 p-3 max-w-sm transition-all duration-200">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Role Switcher (1-Click Preview)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="mt-2.5 space-y-2">
            <p className="text-[11px] text-slate-400">
              Switch roles instantly to inspect each distinct portal:
            </p>

            <div className="grid grid-cols-3 gap-1.5">
              {/* Patient button */}
              <button
                type="button"
                disabled={isSwitching !== null}
                onClick={() => handleSwitchRole("PATIENT")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all ${
                  activeRole === "PATIENT"
                    ? "bg-sky-500 text-white font-bold ring-2 ring-sky-300 ring-offset-2 ring-offset-slate-900"
                    : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Patient</span>
                </div>
                <span className="text-[9px] opacity-75 font-mono mt-0.5">/dashboard</span>
              </button>

              {/* Doctor button */}
              <button
                type="button"
                disabled={isSwitching !== null}
                onClick={() => handleSwitchRole("DOCTOR")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all ${
                  activeRole === "DOCTOR"
                    ? "bg-teal-500 text-white font-bold ring-2 ring-teal-300 ring-offset-2 ring-offset-slate-900"
                    : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-1">
                  <Stethoscope className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Doctor</span>
                </div>
                <span className="text-[9px] opacity-75 font-mono mt-0.5">/doctor/..</span>
              </button>

              {/* Admin button */}
              <button
                type="button"
                disabled={isSwitching !== null}
                onClick={() => handleSwitchRole("ADMIN")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all ${
                  activeRole === "ADMIN"
                    ? "bg-purple-500 text-white font-bold ring-2 ring-purple-300 ring-offset-2 ring-offset-slate-900"
                    : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Admin</span>
                </div>
                <span className="text-[9px] opacity-75 font-mono mt-0.5">/admin/..</span>
              </button>
            </div>

            {isSwitching && (
              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-amber-300">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Switching session to {isSwitching}...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
