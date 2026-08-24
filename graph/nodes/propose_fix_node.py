from langgraph.types import interrupt
from langchain_core.runnables import RunnableConfig
from config.llm import model
from graph.state.state import InvestigationState
from tools.propose_fix import propose_fix
from tools.propose_fix import get_proposal_by_thread_id
from graph.schemas.schemas import FixProposal
from graph.prompts.prompts import generate_fix_proposal_prompt


structured_fixproposal_llm = model.with_structured_output(FixProposal)

def propose_fix_node(state: InvestigationState, config: RunnableConfig) -> dict:
    thread_id = config["configurable"]["thread_id"]

    existing = get_proposal_by_thread_id(thread_id)

    if existing:
        proposed_change = existing["proposed_change"]
        proposal_id = existing["id"]
        is_fix_proposed = True
    else:
        raw_evidence = state.get("evidence_log") or []
        evidence_log = list(raw_evidence)
        investigation_summary = state.get("investigation_summary", "")
        current_hypothesis = state.get("current_hypothesis", "")

        prompt = generate_fix_proposal_prompt(evidence_log, investigation_summary, current_hypothesis)

        try:
            res = structured_fixproposal_llm.invoke(prompt)
            response = res.model_dump() if hasattr(res, 'model_dump') else res.dict()
            proposed_change = response.get('proposed_change', '')
        except Exception:
            return {"proposed_change": "", "is_fix_proposed": False, "route": "end"}

        try:
            fix_proposal = propose_fix(investigation_summary, evidence_log, str(proposed_change), thread_id)
            proposal_id = fix_proposal["id"]
            is_fix_proposed = True
        except Exception:
            return {"proposed_change": proposed_change, "is_fix_proposed": False, "route": "end"}

    decision = interrupt({
        "proposal_id": proposal_id,
        "proposed_change": proposed_change,
        "investigation_summary": state.get("investigation_summary", ""),
    })

    return {
        "is_fix_proposed": is_fix_proposed,
        "proposed_change": proposed_change,
        "proposal_id": proposal_id,
        "human_decision": decision,
        "route": "end"
    }