"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function IncidentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive space-y-3 max-w-2xl">
      <div className="flex items-center gap-2 font-medium text-sm">
        <AlertTriangle className="size-4 shrink-0" />
        <span>Database query failed while loading dashboard data</span>
      </div>
      <p className="text-xs font-mono bg-background/80 p-2.5 rounded border border-border text-foreground overflow-x-auto">
        {error.message || "An unexpected database error occurred."}
      </p>
      <Button variant="outline" size="xs" onClick={() => reset()} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
