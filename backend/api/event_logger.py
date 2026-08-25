import json
import traceback
import psycopg
import os
from dotenv import load_dotenv

load_dotenv()

DB_DSN = os.getenv("POSTGRES_URI")

def log_event(service: str, event_type: str, message: str,
              severity: str = "error", node_or_route: str | None = None,
              thread_id: str | None = None, context: dict | None = None):
    if not DB_DSN:
      print("[events_logger] POSTGRES_URI is not configured; skipping event logging.")
      return

    try:
      with psycopg.connect(DB_DSN) as conn:
        with conn, conn.cursor() as cur:
          cur.execute(
            """
            INSERT INTO events (service, event_type, severity, node_or_route,
                                  thread_id, message, context, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'app_shim')
            """,
            (service, event_type, severity, node_or_route, thread_id,
              message, json.dumps(context or {}))
        )
      conn.close()
    except Exception:
      print(f"[events_logger] failed to log event: {traceback.format_exc()}")