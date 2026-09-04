"use client";

import { useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function IncidentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  const handleTryAgain = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive space-y-3 max-w-2xl font-inter">
      <div className="flex items-center gap-2 font-medium text-sm">
        <AlertTriangle className="size-4 shrink-0" />
        <h2 className="font-geist tracking-tight font-semibold text-sm">
          Database query failed while loading dashboard data
        </h2>
      </div>
      <p className="text-xs font-mono bg-background/80 p-2.5 rounded border border-border text-foreground overflow-x-auto">
        {error.message || "An unexpected database error occurred."}
      </p>
      <Button
        variant="outline"
        size="xs"
        onClick={handleTryAgain}
        className="mt-2 font-inter text-foreground hover:bg-destructive/10"
      >
        Try again
      </Button>
    </div>
  );
}
