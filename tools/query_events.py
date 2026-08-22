from datetime import datetime
from tools.db import pool
from utils.resilience import with_resilience

@with_resilience()
def query_events(service: str = None, node_or_route: str = None, event_type: str= None, severity: str = None, thread_id: str = None,
since: datetime = None, limit: int = 50):
    filters = []
    params = []

    if service:
        filters.append("service = %s")
        params.append(service)
    if node_or_route:
        filters.append("node_or_route = %s")
        params.append(node_or_route)
    if event_type:
        filters.append("event_type = %s")
        params.append(event_type)
    if severity:
        filters.append("severity = %s")
        params.append(severity)
    if thread_id:
        filters.append("thread_id = %s")
        params.append(thread_id)
    if since:
        filters.append("created_at >= %s")
        params.append(since)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    query = f"""
        SELECT id, created_at, service, event_type, severity,
               node_or_route, thread_id, message, context, source
        FROM events
        {where_clause}
        ORDER BY created_at DESC
        LIMIT %s
    """
    params.append(limit)

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return cur.fetchall()


if __name__ == "__main__":
    response = query_events(service="lumen", limit=5)
    print(response)