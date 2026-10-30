import React from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

interface AppShellProps {
  children: React.ReactNode;
  userRole: "PATIENT" | "DOCTOR" | "ADMIN";
  userFullName?: string;
  userIdentifier?: string;
  mobileNumber?: string;
}

export function AppShell({
  children,
  userRole,
  userFullName,
  userIdentifier,
  mobileNumber,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50/60 antialiased print:bg-white print:min-h-0">
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        role={userRole}
        userFullName={userFullName}
        userIdentifier={userIdentifier}
        className="hidden md:flex sticky top-0 h-screen no-print"
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 print:w-full print:block">
        <div className="no-print">
          <TopNav
            userRole={userRole}
            userFullName={userFullName}
            userIdentifier={userIdentifier}
            mobileNumber={mobileNumber}
          />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
