from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from utils.signing import verify_token
from utils.render_decision_page import render_decision_page
from tools.update_proposal_status import update_proposal_status
from graph.execute_graph import graph
from langgraph.types import Command

app = FastAPI(
    title="Sentry Loop",
    description="Autonomous Agent that investigates production incidents by querying logs, metrics, and service health, dynamically testing hypotheses to identify root causes."
)

@app.get("/api/decide", response_class=HTMLResponse)
def decide(token: str):
    result = verify_token(token)
    if result is None:
        html_content = render_decision_page(
            title="Link Expired or Invalid",
            subtitle="This decision token is invalid or has expired. No changes were applied to the pipeline.",
            detail_label="Status Code",
            detail_value="400 — INVALID_TOKEN",
            status_color="#e53935"  # Muted Crimson
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
    config = {"configurable": {"thread_id": thread_id}}
    graph.invoke(Command(resume=decision), config=config)

    # Success Response
    is_approved = decision == "approve"
    status_verb = "Approved" if is_approved else "Rejected"
    status_color = "#1d1d1f" if is_approved else "#6e6e73"
    
    html_content = render_decision_page(
        title=f"Proposal {status_verb}",
        subtitle=f"Your decision has been logged and the autonomous execution workflow has resumed.",
        detail_label="Execution Reference",
        detail_value=f"ID: {proposal_id} | Thread: {thread_id}",
        status_color=status_color
    )

    return HTMLResponse(content=html_content)