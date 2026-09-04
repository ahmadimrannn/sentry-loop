"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

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

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val === "all") {
      params.delete("service");
    } else {
      params.set("service", val);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
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
        <label htmlFor="service-filter" className="font-medium text-foreground">
          Service:
        </label>
        <Select
          id="service-filter"
          value={currentService}
          onChange={handleServiceChange}
          className="w-36"
        >
          <option value="all">All Services</option>
          {services.map((svc) => (
            <option key={svc} value={svc}>
              {svc}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <label htmlFor="status-filter" className="font-medium text-foreground">
          Status:
        </label>
        <Select
          id="status-filter"
          value={currentStatus}
          onChange={handleStatusChange}
          className="w-36"
        >
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>
    </div>
  );
}
