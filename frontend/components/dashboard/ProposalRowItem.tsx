"use client";

import { useState } from "react";
import Link from "next/link";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { ProposalRow } from "@/lib/queries/proposals";

interface ProposalRowItemProps {
  proposal: ProposalRow;
}

function formatDate(dateStr: string | Date) {
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function ProposalRowItem({ proposal }: ProposalRowItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer group hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 font-inter"
      >
        <TableCell className="w-[30px] pr-0 font-inter">
          <button
            type="button"
            className="p-1 rounded text-muted-foreground group-hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
        </TableCell>
        <TableCell>
          <Badge
            variant={
              proposal.status === "approved"
                ? "approved"
                : proposal.status === "rejected"
                ? "rejected"
                : "pending_approval"
            }
          >
            {proposal.status === "pending_approval" ? "pending approval" : proposal.status}
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {proposal.thread_id || "—"}
        </TableCell>
        <TableCell>
          {proposal.incident_id ? (
            <Link
              href={`/dashboard/incidents/${proposal.incident_id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-mono text-xs text-foreground hover:underline font-semibold"
            >
              {proposal.incident_service}
              {proposal.incident_route ? ` (${proposal.incident_route})` : ""}
              <ExternalLink className="size-3 text-muted-foreground" />
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground font-inter">None</span>
          )}
        </TableCell>
        <TableCell className="text-right font-mono text-xs text-muted-foreground">
          {formatDate(proposal.created_at)}
        </TableCell>
      </TableRow>

      {/* Expanded Details Row */}
      {expanded && (
        <TableRow className="bg-neutral-50/70 dark:bg-neutral-900/40 hover:bg-neutral-50/70 font-inter">
          <TableCell colSpan={5} className="p-4 space-y-3">
            <div className="space-y-1">
              <h4 className="font-geist text-xs font-semibold tracking-tight text-foreground">
                Investigation Summary
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-inter whitespace-pre-wrap">
                {proposal.investigation_summary}
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-geist text-xs font-semibold tracking-tight text-foreground">
                Proposed Fix
              </h4>
              <div className="p-2.5 rounded bg-background border border-border text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap">
                {proposal.proposed_change}
              </div>
            </div>

            {Boolean(proposal.evidence) && (
              <div className="space-y-1">
                <h4 className="font-geist text-xs font-semibold tracking-tight text-foreground">
                  Evidence Log ({Array.isArray(proposal.evidence) ? proposal.evidence.length : 1} items)
                </h4>
                <div className="p-2.5 rounded bg-background border border-border text-[11px] font-mono text-muted-foreground max-h-48 overflow-y-auto">
                  <pre>{JSON.stringify(proposal.evidence, null, 2)}</pre>
                </div>
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
