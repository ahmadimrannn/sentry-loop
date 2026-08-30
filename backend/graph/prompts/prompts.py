def generate_classify_severity_prompt(incident_text: str, valid_severities: list[str]) -> str:
    prompt = f"""
    You are classifying the severity of an incident report.

    Incident: {incident_text}

    Choose exactly one severity from this list: {valid_severities}

    Base your choice only on what the incident text actually says. If the text is vague or ambiguous, choose the severity that best reflects the described impact, don't default to the most alarming option just because the report is unclear.
    """

    return prompt


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

def generate_evidence_hypothesis_prompt(incident, checked_this_step, result, investigation_summary):
    prompt = f"""
        Incident under investigation: {incident}

        Tool checked this step: {checked_this_step}
        Raw result from this step: {str(result)[:1000]}

        Current investigation summary (everything known so far): {investigation_summary}

        First, write one plain sentence describing what THIS step's raw result found.

        Then, classify this step's finding against the incident under investigation as one of:
        - DIRECT MATCH: this finding describes the same failure as the incident (same
        component, same error, same symptom) — not just the same service.
        - CONTRIBUTING: plausibly related to or caused by the same root issue, even if
        not an exact match.
        - UNRELATED: a different problem in the same service that happened to also be
        logged, with no clear connection to the incident's stated symptom.

        Then, rewrite the ENTIRE investigation summary from scratch, folding in this
        new finding along with everything already known. Target roughly 150 words,
        hard maximum 200.

        Apply these rules when rewriting:
        - If an earlier finding has since been fully explained or superseded by a more
        specific later finding, keep only the more specific version and remove the
        earlier, now-redundant one.
        - A DIRECT MATCH finding must always be stated first and in the most detail —
        it is the primary subject of the summary, not one item in a list.
        - CONTRIBUTING findings may be mentioned briefly if they plausibly relate to the
        direct match.
        - UNRELATED findings must NOT be folded into the same narrative as the incident.
        Do not imply they share a cause with the direct match, and do not let them
        dilute or compete with the direct match for prominence in the summary. If you
        mention them at all, clearly label them as separate, unrelated observations.

        Then write your current best hypothesis. The hypothesis must describe the cause
        of the incident specifically — not a general statement about the service's
        overall health.
    """

    return prompt

def generate_evidence_prompt(state):
    prompt = f"""
        Evidence found so far:
        {state['evidence_log']}

        Original Incident Text: {state['incident']}
        Service: {state['service']}
        Current hypothesis: {state['current_hypothesis']}

        Before judging confidence, check the hypothesis against the incident text directly:
        does the hypothesis explain THIS incident specifically — same error type or message,
        same node/route, same failure mode — or does it explain a different real problem that
        happens to look similar (e.g. a different KeyError on a different function, a TypeError
        in a different node)? Evidence that is real and well-documented but belongs to a
        different failure than the one described in the incident text does not count as
        support for this hypothesis, no matter how solid it looks on its own.

        Is this hypothesis specific and well-supported enough by the evidence to act on
        right now, even if other parts of the system have not been checked yet?
        Answer false if the evidence is thin, vague, the hypothesis is still a guess,
        OR the hypothesis is well-supported but for a different incident than the one
        stated above.
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

def generate_fix_proposal_prompt(incident, evidence_log, investigation_summary, current_hypothesis, status_after_routing):

    prompt = f"""
        You are a senior fix proposal writer.

        Incident under investigation: {incident}

        Based on these properties, write a clear, structured, organized, and detailed fix proposal so anyone who reads that can perform the fix easily. Also reference the problem with the fix you give for. Write in clear steps if possible. Also make sure the proposal is not too long and not too short. Always be specific.

        Evidence Log: {evidence_log}
        Investigation Summary: {investigation_summary}
        Current Hypothesis: {current_hypothesis}

        Your proposal must fix the incident stated above, specifically. If the evidence log or investigation summary contains findings unrelated to this incident, do not propose fixes for them — mention at most one line that they were observed separately, and stay focused on the incident itself. Do not produce a general "system health" proposal covering multiple unrelated issues.

        Write this note at the start if the status after routing is step limit exceeded. Status after routing: {status_after_routing} {"NOTE: Investigation inconclusive after 15 steps, evidence gathered so far attached, manual review recommended" if status_after_routing == "step_limit_exceeded" else ""}
    """

    return prompt