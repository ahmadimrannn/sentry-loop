from tools.db import pool

def get_stale_pending_proposals(threshold_days: int = 3):
    """Proposals still pending, last emailed more than threshold_days ago."""
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, thread_id, investigation_summary, proposed_change, reminder_count
                FROM proposals
                WHERE status = 'pending_approval'
                  AND last_emailed_at < now() - (%s || ' days')::interval
            """, (threshold_days,))
            return cur.fetchall()

def increment_reminder_count(proposal_id):
    """Bumps the reminder counter and stamps last_emailed_at in one write —
    both change together, so one query, not two."""
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE proposals
                SET reminder_count = reminder_count + 1, last_emailed_at = now()
                WHERE id = %s
            """, (proposal_id,))