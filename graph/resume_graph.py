from langgraph.types import Command
from graph.build_graph import graph

def resume_graph(action: str, config: dict):
    """Resumes the graph after interruption."""

    for state_snapshot in graph.stream(Command(resume=action), config, stream_mode="values"):
        final_state = state_snapshot

    return final_state

if __name__ == "__main__":
    config = {
        "configurable": {
            "thread_id": "test-thread-5"
        }
    }

    result = resume_graph(
        action="approve",
        config=config
    )

    print(result)
