from tools.db import pool

def get_stale_pending_proposals(threshold_days: int = 3):
    """Proposals still awaiting a decision, last emailed more than
    threshold_days ago — due for a reminder."""
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, thread_id, investigation_summary, proposed_change
                FROM proposals
                WHERE status = 'pending_approval'
                  AND last_emailed_at < now() - (%s || ' days')::interval
            """, (threshold_days,))
            return cur.fetchall()

def mark_reminder_sent(proposal_id):
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE proposals SET last_emailed_at = now() WHERE id = %s
            """, (proposal_id,))