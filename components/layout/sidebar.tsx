"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  FileScan,
  FlaskConical,
  Pill,
  Calendar,
  FolderOpen,
  Settings,
  Users,
  ShieldAlert,
  Stethoscope,
  LogOut,
  FilePlus2,
  FileCheck2,
  Activity,
  Layers,
} from "lucide-react";

interface SidebarProps {
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  userFullName?: string;
  userIdentifier?: string;
  className?: string;
}

export function Sidebar({ role, userFullName, userIdentifier, className }: SidebarProps) {
  const pathname = usePathname();

  const patientLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "Medical Profile", icon: User },
    { href: "/reports/radiology", label: "Radiology Reports", icon: FileScan },
    { href: "/reports/laboratory", label: "Laboratory Reports", icon: FlaskConical },
    { href: "/prescriptions", label: "Prescriptions", icon: Pill },
    { href: "/documents", label: "Medical Documents", icon: FolderOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const doctorLinks = [
    { href: "/doctor/dashboard", label: "Clinical Dashboard", icon: LayoutDashboard },
    { href: "/doctor/patients", label: "Authorized Patients", icon: Users },
    { href: "/doctor/prescriptions", label: "Manage Prescriptions", icon: Pill },
    { href: "/doctor/prescriptions/new", label: "Issue Prescription", icon: FilePlus2 },
    { href: "/doctor/reports", label: "Clinical Reports", icon: FileCheck2 },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Admin Overview", icon: LayoutDashboard },
    { href: "/admin/doctors", label: "Doctor Approvals", icon: Stethoscope },
    { href: "/admin/patients", label: "Patient Accounts", icon: Users },
    { href: "/admin/audit-logs", label: "Security & Audit Logs", icon: ShieldAlert },
    { href: "/admin/report-categories", label: "Report Categories", icon: Layers },
    { href: "/admin/settings", label: "Platform Settings", icon: Settings },
  ];

  const links = role === "ADMIN" ? adminLinks : role === "DOCTOR" ? doctorLinks : patientLinks;

  const roleTitle = role === "ADMIN" ? "Administrator" : role === "DOCTOR" ? "Doctor Portal" : "Patient Portal";

  return (
    <aside className={cn("no-print flex flex-col w-64 border-r border-slate-200 bg-white min-h-screen", className)}>
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white shadow-xs">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">NIP Healthcare</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">{roleTitle}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-50 text-sky-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-sky-600" : "text-slate-400")} />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{userFullName || "User Account"}</p>
            <p className="text-[11px] text-slate-500 font-mono truncate">{userIdentifier || role}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
