from datetime import datetime, timedelta, timezone
from graph.state.state import InvestigationState
from config.settings import ALL_SEVERITIES, EVENT_LOOKBACK_HOURS
from tools.query_events import query_events
from tools.query_metrics import query_metrics
from tools.checks_service_status import checks_service_health_status
import logging

logger = logging.getLogger(__name__)

def execute_node(state: InvestigationState) -> dict:
    decision = state.get('pending_decision', {})
    if not isinstance(decision, dict):
        decision = decision.model_dump() if hasattr(decision, 'model_dump') else {}

    service_name = state.get("service", "")
    metrics_checked = bool(state.get("metrics_checked", False))
    service_status_checked = bool(state.get("service_status_checked", False))
    severities_tried = list(state.get('severities_tried', []))
    routes_tried = list(state.get('routes_tried', []))
    known_routes = state.get('known_routes', [])
    step_count = state.get("step_count")

    severities_left = [s for s in ALL_SEVERITIES if s not in severities_tried]
    routes_left = [r for r in known_routes if r not in routes_tried]

    since_cutoff = datetime.now(timezone.utc) - timedelta(hours=EVENT_LOOKBACK_HOURS)

    tool_choice = decision.get('tool')

    if tool_choice == "checks_service_health_status" and not service_status_checked:
        try:
            result = checks_service_health_status(service=service_name)
        except Exception as e:
            result = f"checks_service_health_status failed: {str(e)}"

        tool_result_entry = {
            "step": step_count,
            "tool_name": decision['tool'],
            "result": result
        }
        logger.debug("execute_node: checks_service_health_status result=%s", tool_result_entry)
        return {
            "service_status_checked": True,
            "checked_this_step": "checks_service_health_status",
            "tool_result": tool_result_entry
        }

    elif tool_choice == "query_metrics" and not metrics_checked:
        try:
            result = query_metrics(service=service_name)
            print(result)
        except Exception as e:
            result = f"query_metrics failed: {str(e)}"

        tool_result_entry = {
            "step": step_count,
            "tool_name": decision['tool'],
            "result": result
        }
        logger.debug("execute_node: query_metrics result=%s", tool_result_entry)
        return {
            "metrics_checked": True,
            "checked_this_step": "query_metrics",
            "tool_result": tool_result_entry
        }

    elif severities_left:
        requested_severity = decision.get('severity')
        chosen_severity = requested_severity if requested_severity in severities_left else severities_left[0]

        try:
            result = query_events(service=service_name, severity=chosen_severity, since=since_cutoff, limit=10)
            print(result)
        except Exception as e:
            result = f"query_events failed: {str(e)}"

        tool_result_entry = {
            "step": step_count,
            "tool_name": decision['tool'],
            "result": result
        }
        logger.debug("execute_node: query_events (severity) result=%s", tool_result_entry)
        return {
            "severities_tried": [chosen_severity],
            "checked_this_step": f"severity={chosen_severity}",
            "tool_result": tool_result_entry
        }

    elif routes_left:
        requested_route = decision.get('node_or_route')
        chosen_route = requested_route if requested_route in routes_left else routes_left[0]

        try:
            result = query_events(service=service_name, node_or_route=chosen_route, since=since_cutoff, limit=10)
        except Exception as e:
            result = f"query_events failed: {str(e)}"

        tool_result_entry = {
            "step": step_count,
            "tool_name": decision['tool'],
            "result": result
        }
        logger.debug("execute_node: query_events (route) result=%s", tool_result_entry)
        return {
            "routes_tried": [chosen_route],
            "checked_this_step": f"route={chosen_route}",
            "tool_result": tool_result_entry
        }

    else:
        tool_result_entry = {
            "step": step_count,
            "result": "No unexplored leads remaining."
        }
        logger.debug("execute_node: no unexplored leads result=%s", tool_result_entry)
        return {
            "has_unexplored_lead": False,
            "checked_this_step": "none",
            "tool_result": tool_result_entry,
            "step_count": state.get('step_count', 0) + 1
        }