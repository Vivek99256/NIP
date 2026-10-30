import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { medicalRepo } from "@/lib/db/repo";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function AdminAuditLogsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role !== "ADMIN") redirect("/unauthorized");

  const auditLogs = await medicalRepo.getAuditLogs(100);

  return (
    <AppShell
      userRole="ADMIN"
      userFullName="Platform Administrator"
      userIdentifier="ADMIN-ROOT"
      mobileNumber={auth.user.mobileNumber}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Security &amp; Operational Audit Ledger
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Immutable chronological record of sensitive operations, access events, and clinical status changes.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Sanitized • Zero-PHI Exposure</span>
          </div>
        </div>

        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Timestamp</TableHead>
                  <TableHead>Actor User ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead className="text-right">Sanitized Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {log.actorId || "SYSTEM"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="purple" className="text-[10px] font-mono">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-semibold">
                      {log.entityType}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {log.entityId || "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[11px] text-slate-600 max-w-sm truncate">
                      {log.metadataJson || "{}"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
