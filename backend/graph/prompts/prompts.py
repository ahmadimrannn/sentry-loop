def generate_tool_selection_prompt(incident, current_hypothesis, severities_tried, routes_tried, metrics_checked, service_status_checked, severities_left, routes_left, retrieved_incidents=None):
    memory_block = ""
    if not current_hypothesis and retrieved_incidents:
        formatted = "\n".join(
            f"- [{r['final_status']}, {r['reached_via']}] {r['investigation_summary']}"
            + (f" | Fix proposed: {r['proposed_change']}" if r['proposed_change'] else "")
            for r in retrieved_incidents
        )
        memory_block = f"""
            Possibly related past incidents (unverified leads, not conclusions — confirm with real evidence before treating any of these as fact):
            {formatted}
        """

    prompt = f"""
    Incident: {incident}
    {memory_block}
    Current hypothesis: {current_hypothesis}
    Severities already checked: {severities_tried or 'None'}
    Routes already checked: {routes_tried or 'None'}
    Metrics checked: {metrics_checked}
    Service status checked: {service_status_checked}

    Pick which tool to use next: query_events, query_metrics, or checks_service_health_status.
    If query_events, specify either a severity from {severities_left} or a route from {routes_left}.
    """

    return prompt

def generate_evidence_hypothesis_prompt(checked_this_step, result, investigation_summary):
  prompt = f"""
    Tool checked this step: {checked_this_step}
    Raw result from this step: {str(result)[:1000]}

    Current investigation summary (everything known so far): {investigation_summary}

    First, write one plain sentence describing what THIS step's raw result found.

    Then, rewrite the ENTIRE investigation summary from scratch, folding in this
    new finding along with everything already known. Target roughly 150 words,
    hard maximum 200.

    Apply this concrete rule when rewriting: if an earlier finding has since been fully explained or superseded by a more specific later finding, keep only the more specific version and remove the earlier, now-redundant one. For example, if an earlier finding said "some errors were found" and a later finding identified the exact cause, drop the vague earlier statement entirely, don't keep both. If two findings remain independently relevant, keep both, don't merge them into a false connection.

    Then write your current best hypothesis.
  """

  return prompt

def generate_evidence_prompt(state):
  prompt = f"""
    Evidence found so far:
    {state['evidence_log']}
  
    Original Incident Text: {state['incident']}
    Service: {state['service']}
    Current hypothesis: {state['current_hypothesis']}
  
    Is this hypothesis specific and well-supported enough by the evidence to act on
    right now, even if other parts of the system have not been checked yet?
    Answer false if the evidence is thin, vague, or the hypothesis is still a guess.
  """

  return prompt

def generate_learned_something_new_prompt(state):
  prompt = f"""
    Old hypothesis: {state['previous_hypothesis']}
    New hypothesis: {state['current_hypothesis']}
  
    Did the new hypothesis add any real new fact, detail, or narrower cause compared
    to the old one? Answer false if it is just the same idea said in different words.
  """

  return prompt

def generate_fix_proposal_prompt(evidence_log, investigation_summary, current_hypothesis, status_after_routing):

  prompt = f"""
    You are a senior fix proposal writer.
    Based on these properties, write a clear, structured, organized, and detailed fix proposal so anyone who reads that can perform the fix easily. Also reference the problem with the fix you give for. Write in clear steps if possible. Also make sure the proposal is not too long and not too short. Always be specific.

    Evidence Log: {evidence_log}
    Investigation Summary: {investigation_summary}
    Current Hypothesis: {current_hypothesis}

    Write this note at the start if the status after routing is step limit exceeded. Status after routing: {status_after_routing} {"NOTE: Investigation inconclusive after 15 steps, evidence gathered so far attached, manual review recommended" if status_after_routing == "step_limit_exceeded" else ""}
  """

  return prompt
