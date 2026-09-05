from graph.state.state import InvestigationState
from langchain_core.runnables import RunnableConfig
from memory.write_incident import write_incident
from api.event_logger import log_event


def finalize_node(state: InvestigationState, config: RunnableConfig) -> dict:
    if state.get("is_demo", False):
        return {"final_status": "demo_run_not_persisted"}

    decision = state.get("human_decision")
    service = state.get("service")
    severity = state.get("severity")
    final_status = "approved" if decision == "approve" else "rejected"

    thread_id = config["configurable"]["thread_id"]

    try:
        reached_via = state.get("status_after_routing")

        if not reached_via:
            raise ValueError(
                "status_after_routing is empty or missing before finalize_node"
            )

        write_incident(
            thread_id=thread_id,
            service=service,
            route=state.get("route"),
            severity=severity,
            investigation_summary=state["investigation_summary"],
            proposed_change=state.get("proposed_change"),
            reached_via=reached_via,
            final_status=final_status,
        )

    except Exception as e:
        log_event(
            service="sentryloop",
            event_type="finalize_node_incident_write_failed",
            message=f"write_incident failed for thread {thread_id}",
            severity="error",
            node_or_route="finalize_node",
            thread_id=thread_id,
            context={
                "error": str(e),
                "reached_via": state.get("status_after_routing"),
            },
        )

    return {"final_status": final_status}