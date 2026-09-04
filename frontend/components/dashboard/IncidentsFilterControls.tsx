"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IncidentsFilterControlsProps {
  services: string[];
  currentService?: string;
  currentStatus?: string;
}

export function IncidentsFilterControls({
  services,
  currentService = "all",
  currentStatus = "all",
}: IncidentsFilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleServiceChange = (val: string | null) => {
    if (!val) return;
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") {
      params.delete("service");
    } else {
      params.set("service", val);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleStatusChange = (val: string | null) => {
    if (!val) return;
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") {
      params.delete("status");
    } else {
      params.set("status", val);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-medium text-md text-foreground">Service:</span>
        <Select value={currentService} onValueChange={handleServiceChange}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent className={"px-2 py-2"}>
            <SelectItem value="all">All Services</SelectItem>
            {services.map((svc) => (
              <SelectItem key={svc} value={svc}>
                {svc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Status:</span>
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className={"px-2 py-2"}>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
