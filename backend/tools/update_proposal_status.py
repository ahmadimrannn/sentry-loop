from tools.db import pool
from utils.resilience import with_resilience


@with_resilience()
def update_proposal_status(proposal_id: int, new_status: str):
    """Flips a proposal's status after human review. Never deletes rows —
    rejected proposals stay in the table as eval/pattern data."""

    if new_status not in ("approved", "rejected"):
        raise ValueError(f"invalid status: {new_status}")

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE proposals
                SET status = %s
                WHERE id = %s AND status = 'pending_approval'
                RETURNING id, status, thread_id
            """, (new_status, proposal_id))
            row = cur.fetchone()

    if row is None:
        # either the id doesn't exist, or it was already approved/rejected —
        # this is the single-use guard from the email-link design: a second
        # click or a race can't flip an already-decided proposal
        raise ValueError(f"proposal {proposal_id} not pending_approval or not found")

    return row