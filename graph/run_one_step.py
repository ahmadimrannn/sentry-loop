from tools.query_events import query_events
from tools.query_metrics import query_metrics
from tools.checks_service_status import checks_service_health_status
from graph.state.state import InvestigationState
from graph.schemas.schemas import NextStep
from config.llm import model

ALL_SEVERITIES = ["error", "warning", "critical", "info"]

def run_one_step(state: InvestigationState) -> dict:
    """Runs one step of investigation, querying either severities or routes."""
    
    # Extract current state safely
    severities_tried = list(state.get('severities_tried', []))
    routes_tried = list(state.get('routes_tried', []))
    evidence_log = list(state.get('evidence_log', []))
    known_routes = state.get('known_routes', [])
    metrics_checked = state.get("metrics_checked")
    service_status_checked = state.get("service_status_checked")
    
    severities_left = [s for s in ALL_SEVERITIES if s not in severities_tried]
    routes_left = [r for r in known_routes if r not in routes_tried]

    # Stop early if there is nothing left to explore
    if not (severities_left or routes_left or not metrics_checked or not service_status_checked):
      return {
        "has_unexplored_lead": False,
        "step_count": state.get('step_count', 0) + 1
      }

    # 1. Ask LLM to pick the next target & state initial hypothesis
    prompt = f"""
    Incident: {state['incident']}
    Current hypothesis: {state['current_hypothesis'] or 'none yet'}
    Severities already checked: {severities_tried or 'nothing yet'}
    Routes already checked: {routes_tried or 'nothing yet'}
    Metrics already checked: {metrics_checked}
    Service status already checked: {service_status_checked}

    Pick which tool to use next: query_events, query_metrics, or checks_service_health_status.
    If query_events, also pick which severity or route to look at.
    Write your current best guess at what is wrong.
    """
    
    structured_llm = model.with_structured_output(NextStep)
    try:
      decision = structured_llm.invoke(prompt)
    except Exception as e:
      return {
        "current_hypothesis": f"LLM call failed while deciding next step: {str(e)}",
        "has_unexplored_lead": True,
        "step_count": state.get('step_count', 0) + 1
      }

    checked_this_step = ""
    result = None

    if decision.tool == "checks_service_health_status" and not service_status_checked:
      try:
          result = checks_service_health_status(service=state["service"])
      except Exception as e:
          result = f"{decision.tool} Tool call failed: {str(e)}"

      service_status_checked = True
      checked_this_step = "checks_service_health_status"

    elif decision.tool == "query_metrics" and not metrics_checked:
      try:
          result = query_metrics(service=state["service"])
      except Exception as e:
          result = f"{decision.tool} Tool call failed: {str(e)}"

      metrics_checked = True
      checked_this_step = "query_metrics"

    elif severities_left:
      chosen_severity = decision.severity if decision.severity in severities_left else severities_left[0]
      try:
          result = query_events(service=state["service"], severity=chosen_severity, limit=10)
      except Exception as e:
          result = f"query_events Tool call failed: {str(e)}"

      severities_tried.append(chosen_severity)
      checked_this_step = f"severity={chosen_severity}"

    elif routes_left:
      chosen_route = decision.node_or_route if decision.node_or_route in routes_left else routes_left[0]
      try:
          result = query_events(service=state["service"], node_or_route=chosen_route, limit=10)
      except Exception as e:
          result = f"query_events Tool call failed: {str(e)}"

      routes_tried.append(chosen_route)
      checked_this_step = f"route={chosen_route}"

    else:
      return {
          "has_unexplored_lead": False,
          "step_count": state.get('step_count', 0) + 1
      }

    # Append findings to evidence log
    evidence_entry = {
        "checked": checked_this_step,
        "findings": str(result)[:500]
    }
    evidence_log.append(evidence_entry)

    recent_evidence = evidence_log[-10:]
    followup_prompt = f"""
      Here is everything found so far across the whole investigation:
      {recent_evidence}

      There is {len(recent_evidence)} piece(s) of evidence above. If that list
      is not empty, you must base your hypothesis on it, even if it is only one
      finding. Never say there is no evidence or nothing has been found if the
      list above contains anything at all.

      Based on ALL of this evidence together, not just the most recent finding,
      write your current best hypothesis for what is actually wrong.

      Only say one finding causes or relates to another if the evidence itself
      shows a direct link between them, such as a matching thread_id, a matching
      timestamp window, or one event's message directly referencing the other.
      A shared service name is not enough of a link on its own.

      If two findings do not have a direct link like this, do not connect them.
      State them as separate, unexplained issues instead of inventing a cause
      and effect relationship between them.
    """

    followup_structured_llm = model.with_structured_output(NextStep)

    try:
      followup = followup_structured_llm.invoke(followup_prompt)
    except Exception as e:
      return {
          "current_hypothesis": f"LLM call failed while updating hypothesis. Error: {str(e)}",
          "has_unexplored_lead": True,
          "step_count": state.get('step_count', 0) + 1
      }

    # Check if remaining leads exist
    remaining_severities = [s for s in ALL_SEVERITIES if s not in severities_tried]
    remaining_routes = [r for r in known_routes if r not in routes_tried]
    
    has_unexplored = (
      len(remaining_severities) > 0
      or len(remaining_routes) > 0
      or not metrics_checked
      or not service_status_checked
    )

    # Return partial update dictionary for graph reducer
    return {
      "severities_tried": severities_tried,
      "routes_tried": routes_tried,
      "evidence_log": evidence_log,
      "metrics_checked": metrics_checked,
      "service_status_checked": service_status_checked,
      "current_hypothesis": followup.updated_hypothesis or state.get('current_hypothesis'),
      "has_unexplored_lead": followup.has_unexplored_lead and has_unexplored,
      "step_count": state.get('step_count', 0) + 1
    }