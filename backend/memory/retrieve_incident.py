from tools.db import pool
from tools.get_embeddings import get_embedding
from api.event_logger import log_event
from config.settings import TOP_K, MAX_DISTANCE

def retrieve_similar_incidents(service: str, severity: str, incident: str):
    query_text = f"service: {service}, severity: {severity}, incident: {incident}"

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
                       final_status, embedding <=> %s::vector AS distance
                FROM incidents
                WHERE embedding IS NOT NULL
                ORDER BY distance ASC
                LIMIT %s
                """,
                (query_embedding, TOP_K),
            )
            rows = cur.fetchall()

    return [
        {
            "investigation_summary": r[0],
            "proposed_change": r[1],
            "reached_via": r[2],
            "final_status": r[3],
            "distance": r[4],
        }
        for r in rows
        if r[4] <= MAX_DISTANCE
    ]

