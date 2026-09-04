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

export default async function ProposalsPage({ searchParams }: ProposalsPageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "all";

  const proposals = await getProposals({
    status: statusFilter,
  });

  return (
    <div className="space-y-4 font-inter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="font-geist text-xl font-semibold tracking-tight text-foreground">
            Proposals
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-inter">
            Proposals are approved or rejected from the email sent when they&apos;re created.
          </p>
        </div>
        <ProposalsFilterControls currentStatus={statusFilter} />
      </div>

      {/* Proposals Table */}
      {proposals.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground font-inter">
          No proposals recorded yet.
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px] pr-0 font-inter"></TableHead>
                <TableHead className="w-[140px] font-inter">Status</TableHead>
                <TableHead className="w-[180px] font-inter">Thread ID</TableHead>
                <TableHead className="w-[200px] font-inter">Linked Incident</TableHead>
                <TableHead className="text-right w-[140px] font-inter">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <ProposalRowItem
                  key={proposal.id}
                  proposal={proposal}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
