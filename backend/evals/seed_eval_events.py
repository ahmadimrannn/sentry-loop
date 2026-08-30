import json
import os
import psycopg
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from config.settings import CASES

load_dotenv()
DB_DSN = os.getenv("POSTGRES_URI")


def seed():
    if not DB_DSN:
        raise RuntimeError("POSTGRES_URI not configured")

    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            for case_id, service, event_type, severity, node_or_route, message, days_ago in CASES:
                thread_id = f"eval-{case_id}"
                created_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
                context = json.dumps({"synthetic_eval_case_id": case_id})

                cur.execute(
                    """
                    INSERT INTO events
                        (service, event_type, severity, node_or_route,
                         thread_id, message, context, source, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'app_shim', %s)
                    """,
                    (service, event_type, severity, node_or_route,
                     thread_id, message, context, created_at),
                )
                print(f"seeded {case_id} -> {service}/{event_type} ({created_at.date()})")
        conn.commit()


if __name__ == "__main__":
    seed()