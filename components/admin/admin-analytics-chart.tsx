"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { day: "Mon", appointments: 12, diagnostics: 18, prescriptions: 14 },
  { day: "Tue", appointments: 19, diagnostics: 24, prescriptions: 22 },
  { day: "Wed", appointments: 15, diagnostics: 20, prescriptions: 17 },
  { day: "Thu", appointments: 22, diagnostics: 31, prescriptions: 26 },
  { day: "Fri", appointments: 28, diagnostics: 35, prescriptions: 30 },
  { day: "Sat", appointments: 18, diagnostics: 22, prescriptions: 19 },
  { day: "Sun", appointments: 8, diagnostics: 10, prescriptions: 9 },
];

export function AdminAnalyticsChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="appointments" name="Consultations" fill="#0284c7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="diagnostics" name="Diagnostic Reports" fill="#0d9488" radius={[4, 4, 0, 0]} />
          <Bar dataKey="prescriptions" name="Prescriptions" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
