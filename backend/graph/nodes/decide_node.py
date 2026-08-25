from graph.state.state import InvestigationState
from graph.schemas.schemas import NextStep
from config.settings import ALL_SEVERITIES
from config.llm import model
from graph.prompts.prompts import generate_tool_selection_prompt

structured_llm = model.with_structured_output(NextStep)

def decide_node(state: InvestigationState) -> dict:
  incident = state.get('incident', 'Unknown')
  current_hypothesis = state.get('current_hypothesis') or 'None yet'
  severities_tried = list(state.get('severities_tried', []))
  routes_tried = list(state.get('routes_tried', []))
  known_routes = state.get('known_routes', [])
  metrics_checked = bool(state.get("metrics_checked", False))
  service_status_checked = bool(state.get("service_status_checked", False))

  severities_left = [s for s in ALL_SEVERITIES if s not in severities_tried]
  routes_left = [r for r in known_routes if r not in routes_tried]

  has_unexplored = bool(severities_left or routes_left or not metrics_checked or not service_status_checked)
  if not has_unexplored:
    return {
      "has_unexplored_lead": False,
      "step_count": state.get('step_count', 0) + 1,
      "route": "end"
    }

  prompt = generate_tool_selection_prompt(
    incident,
    current_hypothesis,
    severities_tried,
    routes_tried,
    metrics_checked,
    service_status_checked,
    severities_left,
    routes_left
  )
  
  try:
    response = structured_llm.invoke(prompt)
    decision = response.model_dump()
  except Exception as e:
    return {
      "current_hypothesis": f"LLM call failed while deciding next step: {str(e)}",
      "has_unexplored_lead": True,
      "step_count": state.get('step_count', 0) + 1,
      "route": "end"
    }

  return {
    "pending_decision": decision, 
    "route": "execute"
  }