"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProposalsFilterControlsProps {
  currentStatus?: string;
}

export function ProposalsFilterControls({
  currentStatus = "all",
}: ProposalsFilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (val: string | null) => {
    if (!val) return;
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") {
      params.delete("status");
    } else {
      params.set("status", val);
    }
    router.push(`/dashboard/proposals?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Status:</span>
      <Select value={currentStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending_approval">Pending Approval</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
