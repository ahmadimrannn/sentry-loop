from graph.state.state import InvestigationState
from graph.schemas.schemas import EvidenceAndHypothesis
from config.llm import model
from config.settings import SUMMARY_WORD_LIMIT, ALL_SEVERITIES
from graph.prompts.prompts import generate_evidence_hypothesis_prompt

combined_llm = model.with_structured_output(EvidenceAndHypothesis)

def summarize_node(state: InvestigationState) -> dict:
  checked_this_step = state.get('checked_this_step', 'Unknown tool')
  result = state.get('tool_result', 'No result')
  current_summary = state.get('investigation_summary') or 'Nothing checked yet.'
  
  current_hypothesis = state.get('current_hypothesis') or 'None yet'
  previous_hypothesis = state.get('current_hypothesis')
  evidence_log = list(state.get('evidence_log', []))

  severities_tried = list(state.get('severities_tried', []))
  routes_tried = list(state.get('routes_tried', []))
  known_routes = state.get('known_routes', [])
  metrics_checked = bool(state.get("metrics_checked", False))
  service_status_checked = bool(state.get("service_status_checked", False))

  combined_prompt = generate_evidence_hypothesis_prompt(checked_this_step, result, current_summary)

  try:
    combined = combined_llm.invoke(combined_prompt)
    finding_text = combined.finding_summary
  except Exception as e:
    finding_text = f"Tool call to {checked_this_step} succeeded but processing the result failed: {str(e)}"
    combined = None

  if combined is not None:
    summary_text = combined.updated_investigation_summary
    summary_words = summary_text.split()
    if len(summary_words) > SUMMARY_WORD_LIMIT:
        print(f"WARNING: investigation_summary exceeded {SUMMARY_WORD_LIMIT} words ({len(summary_words)}), truncating.")
        summary_text = " ".join(summary_words[:SUMMARY_WORD_LIMIT]) + "... [truncated]"
  else:
    summary_text = current_summary

  evidence_entry = {"checked": checked_this_step, "findings": finding_text}

  if combined is None:
    has_unexplored_lead = True
  else:
    current_hypothesis = combined.updated_hypothesis
    rem_severities = [s for s in ALL_SEVERITIES if s not in severities_tried]
    rem_routes = [r for r in known_routes if r not in routes_tried]

    still_has_unexplored = bool(rem_severities or rem_routes or not metrics_checked or not service_status_checked)
    has_unexplored_lead = combined.has_unexplored_lead and still_has_unexplored

  return {
    "evidence_log": [evidence_entry],
    "previous_hypothesis": previous_hypothesis,
    "current_hypothesis": current_hypothesis,
    "investigation_summary": summary_text,
    "has_unexplored_lead": has_unexplored_lead,
    "step_count": state.get('step_count', 0) + 1
  }