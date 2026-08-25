import logging
import uuid
from typing import Any
from graph.build_graph import graph
from tools.get_known_routes import get_known_routes

logger = logging.getLogger(__name__)


def run_investigation(
    incident_text: str, service: str, thread_id: str | None = None
) -> dict[str, Any]:
    normalized_service = service.strip().lower()

    active_thread_id = thread_id

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
    }

    final_state: dict[str, Any] = {}
    config = {"configurable": {"thread_id": active_thread_id}}

    try:
        for state_snapshot in graph.stream(
            initial_state, config, stream_mode="values"
        ):
            current_step = state_snapshot.get("step_count", 0)
            current_hypo = state_snapshot.get("current_hypothesis", "N/A")

            logger.info("[Step %s] Hypothesis: %s", current_step, current_hypo)
            final_state = state_snapshot

    except Exception as e:
        logger.exception(
            "Investigation failed on thread_id=%s: %s", active_thread_id, e
        )
        final_state["error"] = str(e)
        final_state["investigation_summary"] = (
            f"Investigation crashed due to an error: {str(e)}"
        )

    return final_state


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    thread_id = str(uuid.uuid4())
    result = run_investigation(
        "Something's wrong across cognilead, not sure what, users are complaining but I can't tell if it's the lead pipeline, the CRM writes, or something else.",
        "CogniLead",
        thread_id
    )

    print("\n================ FINAL RESULT ================")
    print(f"Final Hypothesis: {result.get('current_hypothesis', 'N/A')}")
    print(f"Summary: {result.get('investigation_summary', 'N/A')}")