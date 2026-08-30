import os
from fastapi import FastAPI
from fastapi import Header
from fastapi.responses import HTMLResponse
from utils.signing import verify_token
from utils.render_decision_page import render_decision_page
from tools.update_proposal_status import update_proposal_status
from tools.proposal_reminders import get_stale_pending_proposals, increment_reminder_count
from tools.send_auto_reject_notice import send_auto_reject_notice
from tools.send_approval_email import send_approval_email
from graph.execute_graph import graph
from langgraph.types import Command
from langfuse_config.handler import langfuse_handler

app = FastAPI(
    title="Sentry Loop",
    description="Autonomous Agent that investigates production incidents by querying logs, metrics, and service health, dynamically testing hypotheses to identify root causes."
)

@app.get("/api/remind-stale")
def remind_stale(authorization: str = Header(default=None)):
    expected_secret = os.getenv("CRON_SECRET")
    if not expected_secret or authorization != f"Bearer {expected_secret}":
        return HTMLResponse("Unauthorized", status_code=401)

    stale = get_stale_pending_proposals(threshold_days=3)
    reminders_sent = 0
    auto_rejected = 0

    for row in stale:
        if row["reminder_count"] >= 3:
            try:
                updated = update_proposal_status(row["id"], "rejected")
            except ValueError:
                continue

            config = {
                "configurable": {"thread_id": updated["thread_id"]}, 
                "callbacks": [langfuse_handler]
            }
            graph.invoke(Command(resume="reject"), config=config)
            send_auto_reject_notice(row["id"], row["proposed_change"])
            auto_rejected += 1
        else:
            send_approval_email(
                proposal_id=row["id"],
                proposed_change=row["proposed_change"],
                investigation_summary=row["investigation_summary"],
                thread_id=row["thread_id"],
                is_reminder=True,
            )
            increment_reminder_count(row["id"])
            reminders_sent += 1

    return {"reminders_sent": reminders_sent, "auto_rejected": auto_rejected}

@app.get("/api/decide", response_class=HTMLResponse)
def decide(token: str):
    result = verify_token(token)
    if result is None:
        html_content = render_decision_page(
            title="Link Expired or Invalid",
            subtitle="This decision token is invalid or has expired. No changes were applied to the pipeline.",
            detail_label="Status Code",
            detail_value="400 — INVALID_TOKEN",
            status_color="#e53935"
        )
        return HTMLResponse(content=html_content, status_code=400)

    proposal_id, decision = result
    new_status = "approved" if decision == "approve" else "rejected"

    try:
        row = update_proposal_status(proposal_id, new_status)
    except ValueError:
        html_content = render_decision_page(
            title="Action Already Executed",
            subtitle="This proposal has already been reviewed by an authorized user and cannot be modified again.",
            detail_label="Proposal ID",
            detail_value=str(proposal_id),
            status_color="#f57c00"  # Dark Amber
        )
        return HTMLResponse(content=html_content, status_code=409)

    thread_id = row["thread_id"]
    config = {
        "configurable": {"thread_id": thread_id}, 
        "callbacks": [langfuse_handler]
    }

    graph.invoke(Command(resume=decision), config=config)

    # Success Response
    is_approved = decision == "approve"
    status_verb = "Approved" if is_approved else "Rejected"
    status_color = "#1d1d1f" if is_approved else "#6e6e73"
    
    html_content = render_decision_page(
        title=f"Proposal {status_verb}",
        subtitle=f"Your decision has been logged and the autonomous execution workflow has resumed.",
        detail_label="Execution Reference",
        detail_value=f"Proposal ID: {proposal_id} | Thread ID: {thread_id}",
        status_color=status_color
    )

    return HTMLResponse(content=html_content)