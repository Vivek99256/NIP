"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Menu, X, ShieldCheck, Phone, LogOut } from "lucide-react";
import { Sidebar } from "./sidebar";

interface TopNavProps {
  userRole: "PATIENT" | "DOCTOR" | "ADMIN";
  userFullName?: string;
  userIdentifier?: string;
  mobileNumber?: string;
}

export function TopNav({ userRole, userFullName, userIdentifier, mobileNumber }: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="no-print sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Authenticated Portal</span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>TLS / Role-Verified</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mobileNumber && (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Phone className="h-3 w-3 text-slate-400" />
              <span>{mobileNumber}</span>
            </div>
          )}

          <Badge
            variant={
              userRole === "ADMIN" ? "purple" : userRole === "DOCTOR" ? "teal" : "default"
            }
          >
            {userRole}
          </Badge>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center border border-sky-200">
              {(userFullName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">{userFullName || "Account"}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{userIdentifier || userRole}</p>
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-50 transition-colors flex items-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-xs flex">
          <div className="relative w-72 max-w-full bg-white h-full shadow-2xl flex flex-col">
            <div className="flex justify-end p-3 border-b">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar
              role={userRole}
              userFullName={userFullName}
              userIdentifier={userIdentifier}
              className="w-full flex-1 border-r-0"
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </>
  );
}
