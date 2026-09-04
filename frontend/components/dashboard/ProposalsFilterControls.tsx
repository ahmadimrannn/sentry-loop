"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

interface ProposalsFilterControlsProps {
  currentStatus?: string;
}

export function ProposalsFilterControls({
  currentStatus = "all",
}: ProposalsFilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val === "all") {
      params.delete("status");
    } else {
      params.set("status", val);
    }
    router.push(`/dashboard/proposals?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <label htmlFor="proposal-status-filter" className="font-medium text-foreground">
        Status:
      </label>
      <Select
        id="proposal-status-filter"
        value={currentStatus}
        onChange={handleStatusChange}
        className="w-36"
      >
        <option value="all">All Statuses</option>
        <option value="pending_approval">Pending Approval</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </Select>
    </div>
  );
}
