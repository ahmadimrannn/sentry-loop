from tools.db import pool


def get_known_routes(service: str):

  if not service:
    raise Exception("can't get the known routes without service.")

  with pool.connection() as conn:
    with conn.cursor() as cur:
      cur.execute("""
          SELECT DISTINCT node_or_route
          FROM events
          WHERE (%s::text IS NULL OR service = %s::text)
      """, (service, service))
      rows = cur.fetchall()
      return [row['node_or_route'] for row in rows if row['node_or_route'] is not None]


if __name__ == "__main__":
  routes = get_known_routes("lumen")
  print("Routes:", routes)
