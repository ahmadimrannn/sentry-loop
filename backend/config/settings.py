MAX_STEPS=15 # This one is for the investigator agent to stop
NO_PROGRESS_WINDOW=3 # This one is also for the investigator agent to stop
SUMMARY_WORD_LIMIT=200

LLM_MODEL_NAME="gemini-3.1-flash-lite"

ALL_SEVERITIES = ["error", "warning", "critical", "info"]
FALLBACK_SEVERITY = "warning"
EVENT_LOOKBACK_HOURS = 24 # to pull events under 24 hours

TOP_K=3
MAX_DISTANCE=0.5 # lower distance = more similar