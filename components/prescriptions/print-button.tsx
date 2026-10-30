"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-xs no-print"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      <span>Print / Save as PDF</span>
    </Button>
  );
}
