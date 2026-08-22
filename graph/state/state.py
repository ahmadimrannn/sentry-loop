from typing import Annotated, TypedDict
import operator

class InvestigationState(TypedDict):
  service: str
  incident: str
  step_count: int
  current_hypothesis: str 
  has_unexplored_lead: bool
  severities_tried: list
  routes_tried: list
  known_routes: list
  evidence_log: list
  metrics_checked: bool
  service_status_checked: bool