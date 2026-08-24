from graph.state.state import InvestigationState
from tools.update_proposal_status import update_proposal_status


def finalize_node(state: InvestigationState):
    decision = state.get("human_decision")
    new_status = "approved" if decision == "approve" else "rejected"
    proposal_id = state.get("proposal_id", "")

    try:
        result = update_proposal_status(proposal_id, new_status)
    except Exception as e:
        print("Error while updating the proposal in db. Error:", str(e))

    return {
        "final_status": result['status']
    }