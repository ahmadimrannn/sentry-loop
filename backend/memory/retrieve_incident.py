from tools.db import pool
from tools.get_embeddings import get_embedding
from api.event_logger import log_event
from config.settings import TOP_K, MAX_DISTANCE

def retrieve_similar_incidents(service: str, incident: str):
    query_text = f"service: {service}, incident: {incident}"

    try:
        query_embedding = get_embedding(query_text)
    except Exception as e:
        log_event(
            service="sentryloop",
            event_type="retrieval_embedding_failed",
            message="Could not embed query signal for incident retrieval",
            severity="error",
            node_or_route="retrieve_memory_node",
            context={"error": str(e)},
        )
        return []

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT investigation_summary, proposed_change, reached_via,
                       final_status, embedding <=> %s AS distance
                FROM incidents
                WHERE embedding IS NOT NULL
                ORDER BY distance ASC
                LIMIT %s
                """,
                (query_embedding, TOP_K),
            )
            rows = cur.fetchall()

    return [
        r for r in rows if r["distance"] <=MAX_DISTANCE
    ]

