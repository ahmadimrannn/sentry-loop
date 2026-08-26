from memory.retrieve_incident import retrieve_similar_incidents

def retrieve_memory_node(state: dict) -> dict:
    service = state.get("service")
    pending_decision = state.get("pending_decision", {})
    severity = pending_decision.get("severity")
    incident = state.get("incident")

    results = retrieve_similar_incidents(
        service=service,
        severity=severity,
        incident=incident
    )
    return {"retrieved_incidents": results}