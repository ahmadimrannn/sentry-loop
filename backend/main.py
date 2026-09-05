import os
from fastapi import FastAPI
from fastapi import BackgroundTasks, HTTPException, Request, Header
from fastapi.responses import HTMLResponse
from utils.signing import verify_token
from utils.render_decision_page import render_decision_page
from tools.get_known_routes import get_known_routes
from tools.update_proposal_status import update_proposal_status
from tools.proposal_reminders import get_stale_pending_proposals, increment_reminder_count
from tools.db import pool
from tools.send_auto_reject_notice import send_auto_reject_notice
from tools.send_approval_email import send_approval_email
from graph.execute_graph import graph
from langgraph.types import Command
from langfuse_config.handler import langfuse_handler
from pydantic import BaseModel
from typing import Literal
import time 
import uuid

app = FastAPI(
    title="Sentry Loop",
    description="Autonomous Agent that investigates production incidents by querying logs, metrics, and service health, dynamically testing hypotheses to identify root causes."
)

class InvestigateRequest(BaseModel):
    incident: str
    service: Literal["lumen", "cognilead"]


def run_investigation_background(initial_state: dict, config: dict, thread_id: str):
    """
    Runs the real graph after the HTTP response has already gone back to 
    the frontend. This is what lets /investigate return immediately with 
    just a thread_id, instead of the request sitting open for however 
    long the full investigation actually takes.
    """
    try:
        graph.invoke(initial_state, config=config)
        _update_demo_run_status(thread_id, "done")
    except Exception as e:
        # A crash here means something failed outside the graph's own 
        # internal per-node error handling — record it so the frontend 
        # doesn't poll forever against a run that silently died.
        _update_demo_run_status(thread_id, "error", str(e))


def _update_demo_run_status(thread_id: str, status: str, error: str | None = None):
    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE demo_runs SET status = %s, error = %s WHERE thread_id = %s",
                    (status, error, thread_id),
                )
            conn.commit()
    finally:
        conn.close()


# --- rate limiter, see the caveat below this code before trusting it ---
_rate_limit_store: dict[str, list[float]] = {}
RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW_SECONDS = 3600


def _check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    timestamps = [t for t in _rate_limit_store.get(client_ip, []) if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        _rate_limit_store[client_ip] = timestamps
        return False
    timestamps.append(now)
    _rate_limit_store[client_ip] = timestamps
    return True


@app.post("/investigate")
def start_investigation(payload: InvestigateRequest, background_tasks: BackgroundTasks, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many investigations right now, try again in a bit.")

    normalized_service = payload.service.strip().lower()
    thread_id = f"demo-{uuid.uuid4()}"

    initial_state = {
        "service": normalized_service,
        "incident": payload.incident,
        "current_hypothesis": "",
        "previous_hypothesis": "",
        "investigation_summary": "",
        "has_unexplored_lead": True,
        "metrics_checked": False,
        "service_status_checked": False,
        "step_count": 0,
        "severities_tried": [],
        "known_routes": get_known_routes(normalized_service),
        "routes_tried": [],
        "evidence_log": [],
        "retrieved_incidents": [],
        "status_after_routing": "",
        "severity": "",
        "pending_decision": {},
        "tool_result": [],
        "checked_this_step": "",
        "proposed_change": "",
        "is_fix_proposed": False,
        "human_decision": "",
        "final_status": "",
        "proposal_id": "",
        "route": "",
        "is_demo": True,  # requires the propose_fix_node change described above
    }

    config = {
        "configurable": {"thread_id": thread_id},
        "callbacks": [langfuse_handler],
    }

    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO demo_runs (thread_id, status) VALUES (%s, 'running')", (thread_id,))
            conn.commit()
    finally:
        conn.close()

    background_tasks.add_task(run_investigation_background, initial_state, config, thread_id)

    return {"thread_id": thread_id}


@app.get("/investigate/status/{thread_id}")
def get_investigation_status(thread_id: str):
    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT status, error FROM demo_runs WHERE thread_id = %s", (thread_id,))
                row = cur.fetchone()
    finally:
        conn.close()

    if row is None:
        raise HTTPException(status_code=404, detail="No investigation found for this thread_id.")

    run_status, run_error = row

    if run_status == "error":
        return {"done": True, "error": run_error}

    # Read the graph's own real, live checkpointed state directly — this 
    # is what gives us real step-by-step progress without the graph 
    # itself needing to know a frontend is watching it.
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = graph.get_state(config)

    if snapshot is None or not snapshot.values:
        return {
            "step_count": 0, "checked_this_step": "", "severities_tried": [],
            "routes_tried": [], "investigation_summary": "", "is_fix_proposed": False,
            "proposed_change": None, "reached_via": None, "done": False, "error": None,
        }

    values = snapshot.values

    # snapshot.next is empty once the graph has genuinely finished with 
    # nothing left to run or wait on. Since is_demo=True skips the 
    # interrupt() call, a finished demo run reaches END on its own instead 
    # of pausing — so this is a reliable "actually done" signal here.
    is_done = not snapshot.next

    return {
        "step_count": values.get("step_count", 0),
        "checked_this_step": values.get("checked_this_step", ""),
        "severities_tried": values.get("severities_tried", []),
        "routes_tried": values.get("routes_tried", []),
        "investigation_summary": values.get("investigation_summary", ""),
        "is_fix_proposed": values.get("is_fix_proposed", False),
        "proposed_change": values.get("proposed_change") or None,
        "reached_via": values.get("status_after_routing") or None,
        "done": is_done,
        "error": None,
    }

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