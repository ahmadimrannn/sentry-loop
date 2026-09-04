import Link from "next/link";
import { getIncidents, getIncidentServices } from "@/lib/queries/incidents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IncidentsFilterControls } from "@/components/dashboard/IncidentsFilterControls";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    service?: string;
    status?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
  }>;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatReachedVia(reachedVia: string) {
  switch (reachedVia) {
    case "step_limit_exceeded":
      return "Step Limit Exceeded";
    case "confident_enough_evidence_gathered":
      return "Confident Evidence";
    case "didnt_learn_something_new":
      return "No New Info";
    default:
      return reachedVia.replace(/_/g, " ");
  }
}

export default async function IncidentsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const serviceFilter = params.service || "all";
    const statusFilter = params.status || "all";
    const sort = params.sort || "created_at";
    const dir = params.dir || "desc";

    const [incidents, services] = await Promise.all([
        getIncidents({
        service: serviceFilter,
        status: statusFilter,
        sort,
        dir,
        }),
        getIncidentServices(),
    ]);

    return (
        <div className="space-y-4 font-inter">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
            <div>
            <h1 className="font-geist text-3xl tracking-tighter text-foreground">
                Incidents
            </h1>
            <p className="text-md text-muted-foreground mt-0.5 font-inter">
                Real incident investigations captured from production environments.
            </p>
            </div>
            <IncidentsFilterControls
            services={services}
            currentService={serviceFilter}
            currentStatus={statusFilter}
            />
        </div>

        {/* Incidents Table */}
        {incidents.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground font-inter">
            No incidents recorded yet.
            </div>
        ) : (
            <div className="rounded-md border border-border bg-card overflow-hidden">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-30 font-inter">Service</TableHead>
                    <TableHead className="w-25 font-inter">Severity</TableHead>
                    <TableHead className="w-45 font-inter">Route</TableHead>
                    <TableHead className="w-40 font-inter">Reached Via</TableHead>
                    <TableHead className="w-25 font-inter">Status</TableHead>
                    <TableHead className="text-right w-35 font-inter">Created At</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {incidents.map((incident) => (
                    <TableRow
                    key={incident.id}
                    className="cursor-pointer group hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50"
                    >
                    <TableCell className="font-mono text-xs font-semibold">
                        <Link
                        href={`/dashboard/incidents/${incident.id}`}
                        className="block w-full h-full text-foreground group-hover:underline"
                        >
                        {incident.service}
                        </Link>
                    </TableCell>
                    <TableCell>
                        <Link href={`/dashboard/incidents/${incident.id}`} className="block w-full">
                        <Badge
                            variant={
                            incident.severity === "critical"
                                ? "critical"
                                : incident.severity === "error"
                                ? "error"
                                : "secondary"
                            }
                        >
                            {incident.severity}
                        </Badge>
                        </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-50">
                        <Link href={`/dashboard/incidents/${incident.id}`} className="block w-full truncate">
                        {incident.route || "—"}
                        </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-inter">
                        <Link href={`/dashboard/incidents/${incident.id}`} className="block w-full">
                        {formatReachedVia(incident.reached_via)}
                        </Link>
                    </TableCell>
                    <TableCell>
                        <Link href={`/dashboard/incidents/${incident.id}`} className="block w-full">
                        <Badge
                            variant={
                            incident.final_status === "approved"
                                ? "approved"
                                : "rejected"
                            }
                        >
                            {incident.final_status}
                        </Badge>
                        </Link>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        <Link href={`/dashboard/incidents/${incident.id}`} className="block w-full">
                        {formatDate(incident.created_at)}
                        </Link>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
        )}
        </div>
    );
}