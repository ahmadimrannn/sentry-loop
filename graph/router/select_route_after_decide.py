from graph.state.state import InvestigationState

def select_route_after_decide(state: InvestigationState) -> str:
    """Routes the graph based on the output flag set by decide_node."""
    
    return state.get('route', 'end')