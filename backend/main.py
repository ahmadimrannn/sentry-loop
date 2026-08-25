from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from utils.signing import verify_token
from tools.update_proposal_status import update_proposal_status
from graph.execute_graph import graph
from langgraph.types import Command

app = FastAPI(
    title="Sentry Loop",
    description="Autonomous Agent (like an AI on-call engineer) that investigates production incidents by querying logs, metrics, and service health, dynamically testing hypotheses to identify root causes. It learns from past incidents and drafts fixes for human approval. It never execute changes autonomously."
)

@app.get("/api/decide", response_class=HTMLResponse)
def decide(token: str):
    result = verify_token(token)
    if result is None:
        return HTMLResponse("<h2>Invalid or expired link</h2>", status_code=400)

    proposal_id, decision = result
    new_status = "approved" if decision == "approve" else "rejected"

    try:
        row = update_proposal_status(proposal_id, new_status)
    except ValueError:
        return HTMLResponse("<h2>This proposal was already reviewed.</h2>", status_code=409)

    thread_id = row["thread_id"]
    config = {"configurable": {"thread_id": thread_id}}
    graph.invoke(Command(resume=decision), config=config)

    return HTMLResponse(f"<h2>Proposal {decision}d. Thanks.</h2>")