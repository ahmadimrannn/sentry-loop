from graph.state.state import InvestigationState

def finalize_node(state: InvestigationState) -> dict:
    decision = state.get("human_decision")
    final_status = "approved" if decision == "approve" else "rejected"
    return {"final_status": final_status}