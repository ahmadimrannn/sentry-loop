import resend
import os
from utils.signing import sign_decision
from utils.email_body import generate_email_body

resend.api_key = os.getenv("RESEND_API_KEY")

def send_approval_email(proposal_id, proposed_change, investigation_summary):

    approve_token = sign_decision(str(proposal_id), "approve")
    reject_token = sign_decision(str(proposal_id), "reject")
    base_url = os.environ["WEBHOOK_BASE_URL"]

    approve_url = f"{base_url}/api/decide?token={approve_token}"
    reject_url = f"{base_url}/api/decide?token={reject_token}"

    try:
        resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": os.getenv("APPROVAL_EMAIL"),
            "subject": f"SentryLoop: Fix proposed for proposal. Proposal ID: ({proposal_id})",
            "html": generate_email_body(investigation_summary, proposed_change, approve_url, reject_url)
        })
        email_sent = True
    except Exception as e:
        email_sent = False
        print("Failed to send the email. Error:", str(e))

    return {"email_sent": email_sent}
        