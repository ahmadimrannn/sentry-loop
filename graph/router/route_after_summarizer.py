from graph.state.state import InvestigationState
from config.settings import MAX_STEPS
from config.llm import model
from graph.schemas.schemas import EvidenceCheck, ProgressCheck
from graph.prompts.prompts import generate_evidence_prompt, generate_learned_something_new_prompt

evidence_llm = model.with_structured_output(EvidenceCheck)
progress_llm = model.with_structured_output(ProgressCheck)

def route_after_summarize(state: InvestigationState) -> str:
    """Routing function to determine whether to continue the investigation loop or terminate."""

    step_count = state.get('step_count', 0)
    if step_count >= MAX_STEPS:
        return "propose_fix"

    previous_hypothesis = state.get('previous_hypothesis')
    if not previous_hypothesis:
        return "decide"

    evidence_prompt = generate_evidence_prompt(state)
    try:
        evidence_check = evidence_llm.invoke(evidence_prompt)
        if evidence_check and evidence_check.confident_enough:
            return "propose_fix"
    except Exception:
        evidence_check = None

    if state.get('has_unexplored_lead', False):
        return "decide"

    progress_prompt = generate_learned_something_new_prompt(state)
    try:
        check = progress_llm.invoke(progress_prompt)
        if not check.learned_something_new:
            return "propose_fix"
    except Exception:
        return "propose_fix"

    return "decide"