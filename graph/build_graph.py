from langgraph.graph import StateGraph, END
from graph.state.state import InvestigationState
from graph.nodes.decide_node import decide_node
from graph.nodes.execute_node import execute_node
from graph.nodes.summarize_node import summarize_node
from graph.nodes.propose_fix_node import propose_fix_node
from graph.router.route_after_summarizer import route_after_summarize
from graph.router.select_route_after_decide import select_route_after_decide

def build_graph():
  graph = StateGraph(InvestigationState)

  graph.add_node("decide", decide_node)
  graph.add_node("execute", execute_node)
  graph.add_node("summarize", summarize_node)
  graph.add_node("propose_fix", propose_fix_node)

  graph.set_entry_point("decide")

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

  graph.add_edge("propose_fix", END)

  return graph.compile()


graph = build_graph()