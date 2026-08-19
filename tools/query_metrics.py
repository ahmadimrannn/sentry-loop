import datetime
from tools.db import pool

def query_metrics(service: str = None, since: datetime = None):
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT event_type, severity, node_or_route, COUNT(*) as count
                FROM events
                WHERE (%s IS NULL OR service = %s)
                  AND (%s IS NULL OR created_at >= %s)
                GROUP BY event_type, severity, node_or_route
                ORDER BY count DESC
            """, (service, service, since, since))
            return cur.fetchall()