from memory.retrieve_incident import retrieve_similar_incidents
from api.event_logger import log_event
from langchain_core.runnables import RunnableConfig

def retrieve_memory_node(state: dict, config: RunnableConfig) -> dict:
    service = state.get("service")
    incident = state.get("incident")
    thread_id = config['configurable']['thread_id']

    try:
        results = retrieve_similar_incidents(
            service=service,
            incident=incident
        )
    except Exception as e:
        results= []
        log_event(
            service=service,
            event_type="retrieve_similar_incidents_failed",
            message=str(e),
            severity="error",
            node_or_route="retrieve_memory_node",
            thread_id=thread_id,
        )


    return {"retrieved_incidents": results}