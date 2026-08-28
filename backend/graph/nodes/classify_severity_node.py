from graph.state.state import InvestigationState
from config.llm import model
from graph.schemas.schemas import ClassifySeverity
from config.settings import ALL_SEVERITIES, FALLBACK_SEVERITY
from graph.prompts.prompts import generate_classify_severity_prompt
from api.event_logger import log_event

severity_classifier_structured_llm = model.with_structured_output(ClassifySeverity)

def classify_severity_node(state: InvestigationState):
    """Classify the severity based on the incident text"""

    incident_text = state.get("incident", '')

    classify_severity_prompt = generate_classify_severity_prompt(incident_text, ALL_SEVERITIES)

    try:
        res = severity_classifier_structured_llm.invoke(classify_severity_prompt)
        response = res.model_dump() if hasattr(res, 'model_dump') else res.dict()
        severity = response.get("severity")
    except Exception as e:
        severity = FALLBACK_SEVERITY
        log_event(
            service="sentryloop",
            event_type="severity_classification_failed",
            message="Severity classification failed, using fallback",
            severity="error",
            node_or_route="classify_severity_node",
            context={"error": str(e), "fallback_used": FALLBACK_SEVERITY},
        )


    return {
        "severity": severity
    }