from typing import TypedDict, Annotated
import operator

class InvestigationState(TypedDict):
    step_count: int
    retrieved_incidents: list

    severity: str
    service: str
    incident: str
    previous_hypothesis: str
    current_hypothesis: str 
    pending_decision: dict
    tool_result: list
    has_unexplored_lead: bool
    service_status_checked: bool
    metrics_checked: bool

    investigation_summary: str

    known_routes: list
    severities_tried: Annotated[list, operator.add]
    routes_tried: Annotated[list, operator.add]
    evidence_log: Annotated[list, operator.add]
    checked_this_step: str

    status_after_routing: str

    proposed_change: str
    is_fix_proposed: bool
    human_decision: str
    final_status: str
    proposal_id: str

    route: str