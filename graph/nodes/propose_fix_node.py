from config.llm import model
from graph.state.state import InvestigationState
from tools.propose_fix import propose_fix
from graph.schemas.schemas import FixProposal
from graph.prompts.prompts import generate_fix_proposal_prompt

# Pre-bind structured output model at module level
structured_fixproposal_llm = model.with_structured_output(FixProposal)

def propose_fix_node(state: InvestigationState) -> dict:
    """Generates a fix proposal for the issue and records it in the system."""

    raw_evidence = state.get("evidence_log") or []
    evidence_log = list(raw_evidence)
    investigation_summary = state.get("investigation_summary", "")
    current_hypothesis = state.get("current_hypothesis", "")

    prompt = generate_fix_proposal_prompt(evidence_log, investigation_summary, current_hypothesis)

    try:
        res = structured_fixproposal_llm.invoke(prompt)
        response = res.model_dump() if hasattr(res, 'model_dump') else res.dict()
        proposed_change = response.get('proposed_change', '')
    except Exception as e:
        return {
            "proposed_change": "",
            "is_fix_proposed": False,
            "route": "end"
        }

    try:
        fix_proposal = propose_fix(investigation_summary, evidence_log, str(proposed_change))
        is_fix_proposed = bool(fix_proposal)
    except Exception:
        is_fix_proposed = False

    return {
        "is_fix_proposed": is_fix_proposed,
        "proposed_change": proposed_change,
        "route": "end"
    }