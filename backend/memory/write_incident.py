from tools.db import pool
from utils.resilience import with_resilience
from sentence_transformers import SentenceTransformer
from api.event_logger import log_event

# load the embedding model once at import time, not inside the function
_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


@with_resilience()
def embed_text(text: str) -> list[float]:
    return _model.encode(text, normalize_embeddings=True).tolist()


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
        embedding = embed_text(embedded_text)
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