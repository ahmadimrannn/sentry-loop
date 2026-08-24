from graph.build_graph import graph
from tools.get_known_routes import get_known_routes

def run_investigation(incident_text: str, service: str) -> dict:
    normalized_service = service.strip().lower()

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

    final_state = None

    config = {
        "configurable": {
            "thread_id": "test-thread-5"
        }
    }
    for state_snapshot in graph.stream(initial_state, config, stream_mode="values"):
        current_step = state_snapshot.get("step_count", 0)
        current_hypo = state_snapshot.get("current_hypothesis", "N/A")
        
        print(f"\n--- [Step {current_step}] ---")
        print(f"Current Hypothesis: {current_hypo}")
        
        final_state = state_snapshot

    return final_state

if __name__ == "__main__":
    result = run_investigation(
        "Something's wrong across cognilead, not sure what, users are complaining but I can't tell if it's the lead pipeline, the CRM writes, or something else.",
        "CogniLead"
    )
    
    print("\n================ FINAL RESULT ================")
    print(f"Final Hypothesis: {result.get('current_hypothesis')}")
    print(f"Summary: {result.get('investigation_summary')}")
    print(f"\n Result: {result}")