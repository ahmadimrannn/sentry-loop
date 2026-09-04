import { getProposals } from "@/lib/queries/proposals";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProposalsFilterControls } from "@/components/dashboard/ProposalsFilterControls";
import { ProposalRowItem } from "@/components/dashboard/ProposalRowItem";

export const dynamic = "force-dynamic";

interface ProposalsPageProps {
  searchParams: Promise<{
    status?: string;
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

export default async function ProposalsPage({ searchParams }: ProposalsPageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "all";

  const proposals = await getProposals({
    status: statusFilter,
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Proposals
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            Proposals are approved or rejected from the email sent when they&apos;re created.
          </p>
        </div>
        <ProposalsFilterControls currentStatus={statusFilter} />
      </div>

      {/* Proposals Table */}
      {proposals.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No proposals recorded yet.
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px] pr-0"></TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[180px]">Thread ID</TableHead>
                <TableHead className="w-[200px]">Linked Incident</TableHead>
                <TableHead className="text-right w-[140px]">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <ProposalRowItem
                  key={proposal.id}
                  proposal={proposal}
                  formatDate={formatDate}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
