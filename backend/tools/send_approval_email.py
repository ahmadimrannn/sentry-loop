import os
import logging
from urllib.parse import quote
import resend
from utils.signing import sign_decision
from utils.email_body import generate_email_body

logger = logging.getLogger(__name__)

def send_approval_email(proposal_id: str | int, proposed_change: str, investigation_summary: str) -> dict[str, bool]:
    # Ensure API Key and Base URL exist at runtime
    api_key = os.getenv("RESEND_API_KEY")
    base_url = os.getenv("WEBHOOK_BASE_URL")
    recipient = os.getenv("APPROVAL_EMAIL")

    if not api_key or not base_url or not recipient:
        logger.error("Missing required environment configuration for Resend email service.")
        return {"email_sent": False}

    resend.api_key = api_key

    # Generate tokens and URL-encode them safely (escapes colons/special characters)
    approve_token = quote(sign_decision(str(proposal_id), "approve"))
    reject_token = quote(sign_decision(str(proposal_id), "reject"))

    base_url = base_url.rstrip("/")
    approve_url = f"{base_url}/api/decide?token={approve_token}"
    reject_url = f"{base_url}/api/decide?token={reject_token}"

    try:
        # Note: Replace 'onboarding@resend.dev' with your verified domain in production (e.g., 'approvals@yourdomain.com')
        resend.Emails.send({
            "from": os.getenv("FROM_EMAIL", "onboarding@resend.dev"),
            "to": [recipient],
            "subject": f"SentryLoop: Fix proposed for proposal ID: ({proposal_id})",
            "html": generate_email_body(investigation_summary, proposed_change, approve_url, reject_url)
        })
        return {"email_sent": True}
    except Exception as e:
        logger.exception("Failed to send approval email for proposal_id=%s: %s", proposal_id, e)
        return {"email_sent": False}