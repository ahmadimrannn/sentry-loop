# from psycopg.types.json import Jsonb
import json
from tools.db import pool
from utils.resilience import with_resilience

@with_resilience()
def propose_fix(investigation_summary: str, evidence: list[dict], proposed_change: str):
    """Drafts a fix proposal. Never applies anything — always ends as pending_approval."""

    evidence_json = json.dumps(evidence)

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO proposals (investigation_summary, evidence, proposed_change)
                VALUES (%s, %s, %s)
                RETURNING id, created_at, status
            """, (investigation_summary, evidence_json, proposed_change))
            return cur.fetchone()

if __name__ == "__main__":
    result = propose_fix(
        investigation_summary="CogniLead /leads endpoint failing with SSL connection drops on the Neon pool during company enrichment calls.",
        evidence=[
            {"event_type": "api_exception", "node_or_route": "/leads", "message": "consuming input failed: SSL connection has been closed unexpectedly"},
        ],
        proposed_change="Enable connection health checks on the psycopg_pool ConnectionPool so dead pooled connections are discarded before being handed to a query, instead of failing mid-request.",
    )
    print(result)