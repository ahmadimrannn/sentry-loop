import Link from "next/link";
import { notFound } from "next/navigation";
import { getIncidentById } from "@/lib/queries/incidents";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, FileCode2, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface IncidentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
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

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
        notFound();
    }

    const incident = await getIncidentById(numericId);

    if (!incident) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-5xl font-inter">
        {/* Back Link */}
        <div>
            <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium font-inter"
            >
            <ArrowLeft className="size-3.5" />
            Back to Incidents
            </Link>
        </div>

        {/* Header Identifying Facts Grid */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
                <h1 className="font-geist text-lg font-semibold tracking-tight text-foreground">
                Incident #{incident.id}
                </h1>
                <Badge
                variant={
                    incident.final_status === "approved"
                    ? "approved"
                    : "rejected"
                }
                >
                {incident.final_status}
                </Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
                {formatDate(incident.created_at)}
            </span>
            </div>

            {/* Label / Value Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-inter">
            <div>
                <div className="text-muted-foreground font-medium mb-0.5">Service</div>
                <div className="font-mono font-semibold text-foreground">{incident.service}</div>
            </div>
            <div>
                <div className="text-muted-foreground font-medium mb-0.5">Severity</div>
                <div>
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
                </div>
            </div>
            <div>
                <div className="text-muted-foreground font-medium mb-0.5">Route</div>
                <div className="font-mono text-foreground truncate">{incident.route || "—"}</div>
            </div>
            <div>
                <div className="text-muted-foreground font-medium mb-0.5">Reached Via</div>
                <div className="text-foreground">{formatReachedVia(incident.reached_via)}</div>
            </div>
            </div>
        </div>

        {/* Linked Proposal Card if available */}
        {incident.linked_proposal && (
            <Card className="border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                <FileCode2 className="size-4 text-amber-600 dark:text-amber-400" />
                <CardTitle className="font-geist text-xs font-semibold tracking-tight text-amber-900 dark:text-amber-200">
                    Linked Proposal Available ({incident.linked_proposal.status})
                </CardTitle>
                </div>
                <Link
                href="/dashboard/proposals"
                className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 hover:underline font-medium font-inter"
                >
                View on Proposals page
                <ExternalLink className="size-3" />
                </Link>
            </CardHeader>
            </Card>
        )}

        {/* Free-text Prose Blocks */}
        <div className="space-y-6 font-inter">
            {/* Investigation Summary */}
            <div className="space-y-2">
            <h2 className="font-geist text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <ShieldAlert className="size-4 text-neutral-500" />
                Investigation Summary
            </h2>
            <div className="rounded-lg border border-border bg-card p-4 text-xs leading-relaxed text-foreground font-inter whitespace-pre-wrap">
                {incident.investigation_summary}
            </div>
            </div>

            {/* Proposed Change */}
            {incident.proposed_change && (
            <div className="space-y-2">
                <h2 className="font-geist text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <FileCode2 className="size-4 text-neutral-500" />
                Proposed Change
                </h2>
                <div className="rounded-lg border border-border bg-card p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap bg-neutral-50/50 dark:bg-neutral-900/40 font-mono">
                {incident.proposed_change}
                </div>
            </div>
            )}
        </div>
        </div>
    );
}
