import time
from graph.run_one_step import run_one_step
from graph.utils.check_stop_condition import check_stop_condition
from tools.get_known_routes import get_known_routes

def run_investigation(incident_text: str, service: str):
  state = {
    "service": service.strip().lower(),
    "incident": incident_text,
    "current_hypothesis": "",
    "has_unexplored_lead": True,
    "metrics_checked": False,
    "service_status_checked": False,
    "step_count": 0,
    "severities_tried": [],
    "known_routes": get_known_routes(service.strip().lower()),
    "routes_tried": [],
    "evidence_log": [],
  }

  while True:
    previous_hypothesis = state['current_hypothesis']
    
    updates = run_one_step(state)
    state.update(updates)

    print(f"Step {state['step_count']}: {state['current_hypothesis']}")

    if check_stop_condition(state, previous_hypothesis, state['has_unexplored_lead']):
      break

    time.sleep(15) # setting it to prevent the llm to hit the rpm rate limit which is 15 RPM

  return state

if __name__ == "__main__":
  result = run_investigation("cognilead CRM writes keep failing after retries, is the service even healthy?", "CogniLead")
  print(result)