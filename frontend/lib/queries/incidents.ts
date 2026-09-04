// lib/queries/incidents.ts
import { query } from '@/lib/db';

export interface Incident {
  id: number;
  thread_id: string;
  service: string;
  route: string | null;
  severity: string;
  investigation_summary: string;
  proposed_change: string | null;
  reached_via:
    | 'step_limit_exceeded'
    | 'confident_enough_evidence_gathered'
    | 'didnt_learn_something_new';
  final_status: 'approved' | 'rejected';
  embedded_text: string;
  created_at: string;
}

export interface LinkedProposalInfo {
  id: string;
  status: 'pending_approval' | 'approved' | 'rejected';
}

export interface IncidentWithLinkedProposal extends Incident {
  linked_proposal: LinkedProposalInfo | null;
}

export async function getIncidents(
  options: {
    service?: string;
    status?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
  } = {}
): Promise<Incident[]> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (options.service && options.service !== 'all') {
    params.push(options.service);
    whereClauses.push(`service = $${params.length}`);
  }

  if (options.status && options.status !== 'all') {
    params.push(options.status);
    whereClauses.push(`final_status = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const allowedSortColumns: Record<string, string> = {
    created_at: 'created_at',
    service: 'service',
    severity: 'severity',
    final_status: 'final_status',
    reached_via: 'reached_via',
  };

  const sortColumn =
    options.sort && allowedSortColumns[options.sort]
      ? allowedSortColumns[options.sort]
      : 'created_at';

  const sortDir = options.dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const sql = `
    SELECT 
      id, thread_id, service, route, severity, 
      investigation_summary, proposed_change, reached_via, 
      final_status, embedded_text, created_at
    FROM incidents
    ${whereSql}
    ORDER BY ${sortColumn} ${sortDir}
  `;

  return await query<Incident>(sql, params);
}

export async function getIncidentServices(): Promise<string[]> {
  const rows = await query<{ service: string }>(
    `SELECT DISTINCT service FROM incidents ORDER BY service ASC`
  );
  return rows.map((r) => r.service);
}

export async function getIncidentById(
  id: number
): Promise<IncidentWithLinkedProposal | null> {
  const incidents = await query<Incident>(
    `SELECT id, thread_id, service, route, severity, investigation_summary, proposed_change, reached_via, final_status, embedded_text, created_at FROM incidents WHERE id = $1`,
    [id]
  );

  if (incidents.length === 0) {
    return null;
  }

  const incident = incidents[0];

  if (incident.thread_id) {
    const proposals = await query<LinkedProposalInfo>(
      `SELECT id, status FROM proposals WHERE thread_id = $1 LIMIT 1`,
      [incident.thread_id]
    );

    return {
      ...incident,
      linked_proposal: proposals[0] ?? null,
    };
  }

  return {
    ...incident,
    linked_proposal: null,
  };
}
