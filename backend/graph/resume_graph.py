from langgraph.types import Command
from graph.build_graph import graph
from langfuse_config.handler import langfuse_handler


def resume_graph(action: str, config: dict | None = None, thread_id: str | None = None):
    """Resumes the graph after interruption."""

    if config is None:
        if thread_id is None:
            raise ValueError("config or thread_id is required to resume the graph")
        config = {
            "configurable": {
                "thread_id": thread_id,
            },
            "callbacks": [langfuse_handler]
        }

    final_state = {}
    for state_snapshot in graph.stream(Command(resume=action), config, stream_mode="values"):
        final_state = state_snapshot

    return final_state


if __name__ == "__main__":
    raise SystemExit("Use resume_graph(action, config=...) from the investigation flow")
