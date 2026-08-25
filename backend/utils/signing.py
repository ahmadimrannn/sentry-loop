import hmac
import hashlib
import time
import os

SECRET = os.getenv("APPROVAL_LINK_SECRET") 
LINK_TTL_SECONDS = 60 * 60 * 24 * 3

def sign_decision(proposal_id: str, decision: str) -> str:
    expiry = int(time.time()) + LINK_TTL_SECONDS
    payload = f"{proposal_id}:{decision}:{expiry}"
    signature = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"

def verify_token(token: str) -> tuple[str, str] | None:
    """Returns (proposal_id, decision) if valid, None if tampered/expired."""
    try:
        proposal_id, decision, expiry_str, signature = token.rsplit(":", 3)
    except ValueError:
        return None

    expected_payload = f"{proposal_id}:{decision}:{expiry_str}"
    expected_sig = hmac.new(SECRET.encode(), expected_payload.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(signature, expected_sig):
        return None
    if int(expiry_str) < int(time.time()):
        return None

    return proposal_id, decision