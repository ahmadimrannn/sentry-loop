# memory/write_incident.py

from tools.db import pool
from tools.get_embeddings import get_embedding
from api.event_logger import log_event

def write_incident(
    thread_id: str,
    service: str,
    route: str | None,
    severity: str,
    investigation_summary: str,
    proposed_change: str | None,
    reached_via: str,
    final_status: str,
):
    embedded_text = f"{investigation_summary}\n{proposed_change or ''}".strip()

    try:
        embedding = get_embedding(embedded_text)
    except Exception as e:
        embedding = None
        log_event(
            service="sentryloop",
            event_type="incident_embedding_failed",
            message=f"Embedding failed after retries for thread {thread_id}",
            severity="error",
            node_or_route="finalize_node",
            thread_id=thread_id,
            context={"error": str(e)},
        )

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO incidents (
                    thread_id, service, route, severity,
                    investigation_summary, proposed_change,
                    reached_via, final_status, embedded_text, embedding
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (thread_id) DO NOTHING
                RETURNING id
                """,
                (
                    thread_id, service, route, severity,
                    investigation_summary, proposed_change,
                    reached_via, final_status, embedded_text, embedding,
                ),
            )
            row = cur.fetchone()
            conn.commit()

    if row is None:
        log_event(
            service="sentryloop",
            event_type="incident_insert_conflict_skipped",
            message=f"Incident insert skipped, thread_id already exists: {thread_id}",
            severity="info",
            node_or_route="finalize_node",
            thread_id=thread_id,
        )