import resend
import os
from utils.signing import sign_decision

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
            "subject": f"SentryLoop: fix proposed for proposal {proposal_id}",
            "html": f"""
                <h3>Investigation summary</h3>
                <p>{investigation_summary}</p>
                <h3>Proposed change</h3>
                <p>{proposed_change}</p>
                <p>
                    <a href="{approve_url}" style="padding:10px 20px;background:#2ecc71;color:white;text-decoration:none;">Approve</a>
                    &nbsp;
                    <a href="{reject_url}" style="padding:10px 20px;background:#e74c3c;color:white;text-decoration:none;">Reject</a>
                </p>
            """
        })
        email_sent = True
    except Exception as e:
        email_sent = False
        print("Failed to send the email. Error:", str(e))

    return {"email_sent": email_sent}
        