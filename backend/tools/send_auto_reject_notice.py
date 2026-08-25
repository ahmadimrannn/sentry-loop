import resend
import os

def send_auto_reject_notice(proposal_id, proposed_change):
    resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": os.getenv("APPROVAL_EMAIL"),
        "subject": f"SentryLoop: Proposal ({proposal_id}). Auto-rejected (No response after 3 reminders)",
        "html": f"""
            <p>This proposal received no response after the original email and 3 reminders,
            so it has been automatically rejected. No fix was applied.</p>
            <h3>Proposed change (for reference)</h3>
            <p>{proposed_change}</p>
        """
    })