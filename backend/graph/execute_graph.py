import logging
import uuid
from time import sleep
from typing import Any
from graph.build_graph import graph
from tools.get_known_routes import get_known_routes
from tools.propose_fix import get_proposal_by_thread_id
from graph.resume_graph import resume_graph
from langfuse_config.handler import langfuse_handler

logger = logging.getLogger(__name__)


def run_investigation(
    incident_text: str, service: str, thread_id: str | None = None
) -> dict[str, Any]:
    normalized_service = service.strip().lower()

    active_thread_id = thread_id or str(uuid.uuid4())

    initial_state = {
        "service": normalized_service,
        "incident": incident_text,
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
    }

    final_state: dict[str, Any] = {}
    config = {
        "configurable": {"thread_id": active_thread_id},
        "callbacks": [langfuse_handler]
    }

    try:
        for state_snapshot in graph.stream(
            initial_state, config, stream_mode="values"
        ):
            current_step = state_snapshot.get("step_count", 0)
            current_hypo = state_snapshot.get("current_hypothesis", "N/A")

            logger.info("[Step %s] Hypothesis: %s", current_step, current_hypo)
            logger.debug("[Step %s] tool_result: %s", current_step, state_snapshot.get("tool_result"))
            final_state = state_snapshot
            # Pause after each step to allow external observation/actions
            sleep(4)

    except Exception as e:
        logger.exception(
            "Investigation failed on thread_id=%s: %s", active_thread_id, e
        )
        final_state["error"] = str(e)
        final_state["investigation_summary"] = (
            f"Investigation crashed due to an error: {str(e)}"
        )

    return final_state


def wait_for_proposal_decision(
    thread_id: str, poll_interval_seconds: float = 2.0
) -> str:
    while True:
        proposal = get_proposal_by_thread_id(thread_id)
        if proposal and proposal.get("status") != "pending_approval":
            return "approve" if proposal["status"] == "approved" else "reject"

        logger.info("Waiting for email decision on thread_id=%s", thread_id)
        sleep(poll_interval_seconds)


def run_investigation_to_completion(
    incident_text: str, service: str, thread_id: str | None = None
) -> dict[str, Any]:
    active_thread_id = thread_id or str(uuid.uuid4())

    result = run_investigation(incident_text, service, active_thread_id)

    if result.get("proposal_id") and not result.get("final_status"):
        action = wait_for_proposal_decision(active_thread_id)
        logger.info(
            "Resuming graph with %s on thread_id=%s",
            action,
            active_thread_id,
        )
        result = resume_graph(
            action=action,
            config={"configurable": {"thread_id": active_thread_id}},
        )

    return result


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    thread_id = str(uuid.uuid4())
    result = run_investigation(
        service="lumen", incident_text="Researcher node crashes with KeyError: 'results' when calling the Tavily search tool during a query.",
        thread_id=thread_id
    )

    print("\n================ FINAL RESULT ================")
    print(f"Final Hypothesis: {result.get('current_hypothesis', 'N/A')}")
    print(f"Summary: {result.get('investigation_summary', 'N/A')}")
    print(f"Result: {result}")