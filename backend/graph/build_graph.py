from langgraph.graph import StateGraph, END
from graph.state.state import InvestigationState
from graph.nodes.retrieve_memory_node import retrieve_memory_node
from graph.nodes.decide_node import decide_node
from graph.nodes.execute_node import execute_node
from graph.nodes.summarize_node import summarize_node
from graph.nodes.propose_fix_node import propose_fix_node
from graph.nodes.finalize_node import finalize_node
from graph.router.route_after_summarizer import route_after_summarize
from graph.router.select_route_after_decide import select_route_after_decide

from database.config import checkpointer

def build_graph():
  graph = StateGraph(InvestigationState)

  graph.add_node("retrieve_memory", retrieve_memory_node)
  graph.add_node("decide", decide_node)
  graph.add_node("execute", execute_node)
  graph.add_node("summarize", summarize_node)
  graph.add_node("propose_fix", propose_fix_node)
  graph.add_node("finalize", finalize_node)

  graph.set_entry_point("retrieve_memory")

  graph.add_edge("retrieve_memory", "decide")
  graph.add_conditional_edges(
    "decide",
    select_route_after_decide,
    {
      "execute": "execute", 
      "end": END
    }
  )

  graph.add_edge("execute", "summarize")

  graph.add_conditional_edges(
    "summarize",
    route_after_summarize,
    {
      "decide": "decide", 
      "propose_fix": "propose_fix"
    }
  )

  graph.add_edge("propose_fix", "finalize")
  graph.add_edge("finalize", END)

  return graph.compile(checkpointer=checkpointer)


graph = build_graph()