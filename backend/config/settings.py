MAX_STEPS=15 # This one is for the investigator agent to stop
NO_PROGRESS_WINDOW=3 # This one is also for the investigator agent to stop
SUMMARY_WORD_LIMIT=200

LLM_MODEL_NAME="gemini-3.5-flash-lite"

ALL_SEVERITIES = ["error", "warning", "critical", "info"]
FALLBACK_SEVERITY = "warning"
EVENT_LOOKBACK_HOURS = 216 # to pull events under 24 hours

TOP_K=3
MAX_DISTANCE=0.5 # lower distance = more similar


# These cases are for eval dataset created in the LangFuse
# (case_id, service, event_type, severity, node_or_route, message, days_ago)
CASES = [
    ("lumen-01", "lumen", "unhandled_exception", "error", "researcher",
     "KeyError: 'results'", 2),
    ("lumen-02", "lumen", "unhandled_exception", "error", "supervisor_router",
     "KeyError: ''", 2),
    ("lumen-03", "lumen", "unhandled_exception", "error", "researcher",
     "IndexError: list index out of range", 1),
    ("lumen-04", "lumen", "unhandled_exception", "error", "researcher",
     "TypeError: expected str, got AIMessage", 1),
    ("lumen-05", "lumen", "unhandled_exception", "error", "researcher",
     "TypeError: supervisor_router() missing 1 required positional argument", 3),
    ("lumen-06", "lumen", "averaging_blend_risk", "warning", "evaluate_results",
     "Relevance check passed via averaged score despite high score variance across results", 1),
    ("cognilead-01", "cognilead", "unhandled_exception", "error", "leads_failed_endpoint",
     "KeyError: field missing from SELECT", 2),
    ("cognilead-02", "cognilead", "unhandled_exception", "error", "resume_graph",
     "KeyError: thread_id not found in checkpoint", 1),
]
