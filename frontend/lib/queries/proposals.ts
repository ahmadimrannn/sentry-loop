// lib/queries/proposals.ts
import { query } from '@/lib/db';

export interface ProposalRow {
  id: string;
  created_at: string;
  investigation_summary: string;
  evidence: unknown;
  proposed_change: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  thread_id: string | null;
  last_emailed_at: string;
  reminder_count: number;
  incident_id: number | null;
  incident_service: string | null;
  incident_route: string | null;
}

export async function getProposals(
  options: {
    status?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
  } = {}
): Promise<ProposalRow[]> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (options.status && options.status !== 'all') {
    params.push(options.status);
    whereClauses.push(`p.status = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sortDir = options.dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const sql = `
    SELECT 
      p.id, 
      p.created_at, 
      p.investigation_summary, 
      p.evidence, 
      p.proposed_change, 
      p.status, 
      p.thread_id, 
      p.last_emailed_at, 
      p.reminder_count,
      i.id AS incident_id,
      i.service AS incident_service,
      i.route AS incident_route
    FROM proposals p
    LEFT JOIN incidents i ON p.thread_id = i.thread_id
    ${whereSql}
    ORDER BY p.created_at ${sortDir}
  `;

  const rows = await query<Record<string, unknown>>(sql, params);

  return rows.map((r) => ({
    id: String(r.id),
    created_at: r.created_at ? new Date(r.created_at as string | Date).toISOString() : '',
    investigation_summary: String(r.investigation_summary ?? ''),
    evidence: r.evidence,
    proposed_change: String(r.proposed_change ?? ''),
    status: (r.status as 'pending_approval' | 'approved' | 'rejected') ?? 'pending_approval',
    thread_id: r.thread_id ? String(r.thread_id) : null,
    last_emailed_at: r.last_emailed_at ? new Date(r.last_emailed_at as string | Date).toISOString() : '',
    reminder_count: Number(r.reminder_count ?? 0),
    incident_id: r.incident_id != null ? Number(r.incident_id) : null,
    incident_service: r.incident_service ? String(r.incident_service) : null,
    incident_route: r.incident_route ? String(r.incident_route) : null,
  }));
}
