from graph.execute_graph import run_investigation
from tools.propose_fix import get_proposal_by_thread_id

def sentryloop_eval_task(item, thread_id_override: str | None = None) -> dict:
    """
    item.input is expected to have: {"service": ..., "incident_signal": ...}
    (matches how the dataset was populated from the seed CSV).

    Returns the fields the judge needs (investigation_summary, proposed_change)
    plus unscored diagnostics (step_count, reached_via) for eyeballing
    trajectory quality alongside the judge's verdict — these are never
    passed to the judge itself.
    """
    service = item.input["service"]
    incident_signal = item.input["incident_signal"]

    # Case ID is something that we have to derive from the dataset itself on the LangFuse
    case_id = item.metadata.get("id") if item.metadata else None
    thread_id = thread_id_override or (f"eval-{case_id}" if case_id else None)


    final_state = run_investigation(
        incident_text=incident_signal,
        service=service,
        thread_id=thread_id,
    )

    # after run_investigation returns:
    proposal = get_proposal_by_thread_id(thread_id) if thread_id else None
    proposed_change = proposal.get("proposed_change", "") if proposal else ""

    return {
        "investigation_summary": final_state.get("investigation_summary", ""),
        "proposed_change": proposed_change,
        "tool_result": final_state.get("tool_result"),
        "step_count": final_state.get("step_count"),
        "reached_via": final_state.get("status_after_routing"),
        "error": final_state.get("error"),
    }


if __name__ == "__main__":

    sentryloop_eval_task(

    )