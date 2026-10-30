import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";

export default async function UnauthorizedPage() {
  const auth = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-center selection:bg-rose-500 selection:text-white">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h2 className="mt-5 text-2xl font-extrabold text-slate-900 tracking-tight">
          Access Restricted
        </h2>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          You do not have the required clinical or administrative authorization to access this specific resource.
        </p>

        {auth && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-left">
            <span className="text-slate-500 block">Current Authenticated Account:</span>
            <div className="mt-1 flex items-center justify-between font-mono">
              <span className="font-semibold text-slate-800">{auth.user.mobileNumber}</span>
              <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">{auth.user.role}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <Link href={auth?.user.role === "ADMIN" ? "/admin/dashboard" : auth?.user.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard"}>
            <Button className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Your Portal</span>
            </Button>
          </Link>

          <form action="/api/auth/logout" method="POST">
            <Button variant="outline" className="w-full gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
              <LogOut className="h-4 w-4" />
              <span>Sign Out &amp; Switch Account</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
