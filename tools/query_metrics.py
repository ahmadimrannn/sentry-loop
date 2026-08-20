import datetime
from tools.db import pool
from utils.resilience import with_resilience

@with_resilience()
def query_metrics(service: str = None, since: datetime = None):
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT event_type, severity, node_or_route, COUNT(*) as count
                FROM events
                WHERE (%s::text IS NULL OR service = %s::text)
                  AND (%s::timestamptz IS NULL OR created_at >= %s::timestamptz)
                GROUP BY event_type, severity, node_or_route
                ORDER BY count DESC
            """, (service, service, since, since))
            return cur.fetchall()


if __name__ == "__main__":
    response = query_metrics(service="cognilead")
    print(response)