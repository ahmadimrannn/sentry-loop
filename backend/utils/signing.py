import hashlib
import hmac
import os
import time

SECRET_STR = os.getenv("APPROVAL_LINK_SECRET")
if not SECRET_STR:
    raise RuntimeError("CRITICAL: APPROVAL_LINK_SECRET environment variable is not set.")

SECRET = SECRET_STR.encode("utf-8")
LINK_TTL_SECONDS = 60 * 60 * 24 * 3  # 3 days


def sign_decision(proposal_id: str, decision: str) -> str:
    if ":" in proposal_id or ":" in decision:
        raise ValueError("proposal_id and decision cannot contain colons.")

    expiry = int(time.time()) + LINK_TTL_SECONDS
    payload = f"{proposal_id}:{decision}:{expiry}"
    signature = hmac.new(SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"


def verify_token(token: str) -> tuple[str, str] | None:
    """Returns (proposal_id, decision) if valid, None if tampered/expired."""
    try:
        proposal_id, decision, expiry_str, signature = token.rsplit(":", 3)
        expiry = int(expiry_str)
    except (ValueError, TypeError):
        return None

    expected_payload = f"{proposal_id}:{decision}:{expiry_str}"
    expected_sig = hmac.new(
        SECRET, expected_payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature.encode("utf-8"), expected_sig.encode("utf-8")):
        return None

    if expiry < int(time.time()):
        return None

    return proposal_id, decision