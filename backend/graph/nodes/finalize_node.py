from graph.state.state import InvestigationState
from langchain_core.runnables import RunnableConfig
from memory.write_incident import write_incident

def finalize_node(state: InvestigationState, config: RunnableConfig) -> dict:
    decision = state.get("human_decision")
    final_status = "approved" if decision == "approve" else "rejected"
    thread_id = config["configurable"]["thread_id"]

    write_incident(
        thread_id=thread_id,
        service=state["service"],
        route=state.get("route"),
        severity=state["severity"],
        investigation_summary=state["investigation_summary"],
        proposed_change=state.get("proposed_change"),
        reached_via=state["status_after_routing"],
        final_status=final_status,
    )

    return {"final_status": final_status}