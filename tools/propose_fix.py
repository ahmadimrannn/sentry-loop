import json
from tools.db import pool
from utils.resilience import with_resilience


@with_resilience()
def get_proposal_by_thread_id(thread_id: str):
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, created_at, status, thread_id, proposed_change
                FROM proposals
                WHERE thread_id = %s
            """, (thread_id,))
            return cur.fetchone()


@with_resilience()
def propose_fix(investigation_summary: str, evidence: list[dict], proposed_change: str, thread_id: str):
    """Drafts a fix proposal. Never applies anything — always ends as pending_approval.
    Idempotent per thread_id: interrupt() replays this node on resume, so a second
    call for the same thread_id must return the existing row, not insert a duplicate."""

    existing = get_proposal_by_thread_id(thread_id)
    if existing:
        return existing

    evidence_json = json.dumps(evidence)

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO proposals (investigation_summary, evidence, proposed_change, thread_id)
                VALUES (%s, %s, %s, %s)
                RETURNING id, created_at, status, thread_id
            """, (investigation_summary, evidence_json, proposed_change, thread_id))
            row = cur.fetchone()

    # TODO Phase 5 step 2: send approval email here, only reached on a real insert
    # (never on the existing-row branch above), so it can't double-send on resume replay.

    return row

if __name__ == "__main__":
    result = propose_fix(
        investigation_summary="CogniLead /leads endpoint failing with SSL connection drops on the Neon pool during company enrichment calls.",
        evidence=[
            {"event_type": "api_exception", "node_or_route": "/leads", "message": "consuming input failed: SSL connection has been closed unexpectedly"},
        ],
        proposed_change="Enable connection health checks on the psycopg_pool ConnectionPool so dead pooled connections are discarded before being handed to a query, instead of failing mid-request.",
    )
    print(result)