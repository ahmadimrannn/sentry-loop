from pydantic import Field, BaseModel
from typing_extensions import Literal

class NextStep(BaseModel): # This schema is for run_investigation file
  tool: Literal["query_events", "query_metrics", "check_service_status"] = Field(description="which tool to use next")
  severity: Literal["error", "warning", "critical", "info"] = Field(description="only used if tool is query_events")
  node_or_route: str = Field(description="only used if tool is query_events, once all severities are checked")
  updated_hypothesis: str = Field(description="best guess so far at what is wrong, in plain words")
  has_unexplored_lead: bool = Field(description="true if you know a specific next thing to check that you have not checked yet")

class ProgressCheck(BaseModel): # This schema is for check_stop_condition util function
  learned_something_new: bool = Field(description="true only if the new hypothesis adds a real fact or narrows the cause compared to the old one, not just reworded")

class EvidenceCheck(BaseModel): # This schema is for check_stop_condition util function
  confident_enough: bool = Field(description="true only if the evidence found so far is specific and well-supported enough to act on right now")
  reasoning: str = Field(description="one sentence explaining why, referencing specific evidence")

