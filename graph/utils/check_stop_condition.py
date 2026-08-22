from graph.schemas.schemas import ProgressCheck, EvidenceCheck
from config.llm import model
from graph.state.state import InvestigationState
from config.settings import MAX_STEPS

def check_stop_condition(state: InvestigationState, previous_hypothesis: str, has_unexplored_lead: bool):
  if state['step_count'] >= MAX_STEPS:
    return True

  if previous_hypothesis == "":
    return False

  structured_evidence_llm = model.with_structured_output(EvidenceCheck)

  evidence_prompt = f"""
  Evidence found so far:
  {state['evidence_log']}

  Original Incident Text: {state['incident']}
  Service: {state['service']}
  Current hypothesis: {state['current_hypothesis']}

  Is this hypothesis specific and well-supported enough by the evidence to act on
  right now, even if other parts of the system have not been checked yet?
  Answer false if the evidence is thin, vague, or the hypothesis is still a guess.
  """

  try:
    evidence_check = structured_evidence_llm.invoke(evidence_prompt)
  except Exception as e:
    evidence_check = None

  if evidence_check is not None and evidence_check.confident_enough:
    return True

  if has_unexplored_lead: 
    return False

  structured_checker_llm = model.with_structured_output(ProgressCheck)

  prompt = f"""
  Old hypothesis: {previous_hypothesis}
  New hypothesis: {state['current_hypothesis']}

  Did the new hypothesis add any real new fact, detail, or narrower cause compared
  to the old one? Answer false if it is just the same idea said in different words.
  """

  try:
    check = structured_checker_llm.invoke(prompt)
  except Exception:
    return False

  return not check.learned_something_new