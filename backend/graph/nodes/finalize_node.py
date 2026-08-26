from graph.state.state import InvestigationState
from langchain_core.runnables import RunnableConfig
from memory.write_incident import write_incident
from api.event_logger import log_event

def finalize_node(state: InvestigationState, config: RunnableConfig) -> dict:
    decision = state.get("human_decision")
    service = state.get("service")
    pending_decision = state.get("pending_decision", {})
    severity = pending_decision.get("severity")
    final_status = "approved" if decision == "approve" else "rejected"
    thread_id = config["configurable"]["thread_id"]

    try:
        write_incident(
            thread_id=thread_id,
            service=service,
            route=state.get("route"),
            severity=severity,
            investigation_summary=state["investigation_summary"],
            proposed_change=state.get("proposed_change"),
            reached_via=state["status_after_routing"],
            final_status=final_status,
        )
    except Exception as e:
        # the approval/rejection itself already succeeded before this ran —
        # never let a memory-write failure surface as a broken response
        log_event(
            service="sentryloop",
            event_type="finalize_node_incident_write_failed",
            message=f"write_incident raised for thread {state['thread_id']}",
            severity="error",
            node_or_route="finalize_node",
            thread_id=state["thread_id"],
            context={"error": str(e)},
        )


    return {"final_status": final_status}