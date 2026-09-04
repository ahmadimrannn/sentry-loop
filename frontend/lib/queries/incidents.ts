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

  const rows = await query<Record<string, unknown>>(sql, params);

  return rows.map((r) => ({
    id: Number(r.id),
    thread_id: String(r.thread_id),
    service: String(r.service),
    route: r.route ? String(r.route) : null,
    severity: String(r.severity),
    investigation_summary: String(r.investigation_summary ?? ''),
    proposed_change: r.proposed_change ? String(r.proposed_change) : null,
    reached_via: r.reached_via as Incident['reached_via'],
    final_status: r.final_status as Incident['final_status'],
    embedded_text: String(r.embedded_text ?? ''),
    created_at: r.created_at ? new Date(r.created_at as string | Date).toISOString() : '',
  }));
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
  const incidents = await query<Record<string, unknown>>(
    `SELECT id, thread_id, service, route, severity, investigation_summary, proposed_change, reached_via, final_status, embedded_text, created_at FROM incidents WHERE id = $1`,
    [id]
  );

  if (incidents.length === 0) {
    return null;
  }

  const r = incidents[0];
  const incident: Incident = {
    id: Number(r.id),
    thread_id: String(r.thread_id),
    service: String(r.service),
    route: r.route ? String(r.route) : null,
    severity: String(r.severity),
    investigation_summary: String(r.investigation_summary ?? ''),
    proposed_change: r.proposed_change ? String(r.proposed_change) : null,
    reached_via: r.reached_via as Incident['reached_via'],
    final_status: r.final_status as Incident['final_status'],
    embedded_text: String(r.embedded_text ?? ''),
    created_at: r.created_at ? new Date(r.created_at as string | Date).toISOString() : '',
  };

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
