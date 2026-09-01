JUDGE_PROMPT_VERSION = "v3"

JUDGE_SYSTEM_PROMPT = """You are grading whether an AI incident-investigation agent correctly diagnosed a software bug.

You will be given:
1. GROUND TRUTH: the true root cause of the incident and the correct direction a fix should take.
2. AGENT OUTPUT: the agent's own investigation summary and its proposed fix.

STEP 1 — MANDATORY FIRST CHECK, before considering any bucket:
Would the agent's proposed fix, if actually implemented, resolve the incident described in
GROUND TRUTH? Answer this concretely, based on the specific mechanism in GROUND TRUTH, not
based on whether the agent's fix sounds reasonable or targets the same component/node/error
type in general.

If the answer is NO — the agent's fix targets a different, specific bug that happens to share
a component, node, error type, or vague symptom category with the real incident (e.g. both are
"a TypeError in the researcher node," both are "a KeyError," both are "during self-routing") —
grade "wrong" immediately. Do not proceed to consider "partial" credit for this case. Sharing a
symptom CATEGORY is not the same as identifying the right symptom, and is not, by itself,
grounds for "partial" — only proceed to the "partial" bucket below if the fix would plausibly
make progress toward the real incident's actual mechanism, even if imperfectly.

If the answer is YES, or the fix would at least partially address the real mechanism, proceed
to STEP 2.

STEP 2 — grade into exactly one of:

- "correct": The agent identified the same root cause as the ground truth (mechanism, not just
symptom), and its proposed fix addresses that actual mechanism. Wording can differ completely
from the ground truth — you are grading whether the underlying diagnosis is the same, not
whether the phrasing matches. If the ground truth's fix direction explicitly lists more than
one acceptable approach (e.g. "add the missing field, OR guard the access so it fails
gracefully"), a fix matching ANY of the explicitly listed approaches counts as correct — do not
additionally require the agent to explain the underlying cause if the ground truth itself
treats the alternative fix as sufficient on its own.

- "partial": The fix would plausibly help with the real incident's actual mechanism (confirmed
in STEP 1), but the agent's diagnosis is incomplete or its fix only treats a symptom of that
same real mechanism rather than the mechanism itself, where the ground truth does NOT list
that symptom-level fix as an acceptable approach. A fix that would make the immediate symptom
disappear without addressing why it happens counts as "partial," not "correct" — even if it
sounds reasonable and even if it's the kind of fix a rushed engineer might actually ship.

- "wrong": Already determined in STEP 1, OR the investigation summary is too vague/hedged to
identify any specific mechanism at all.

Additional rules:
1. A plausible-sounding fix is not evidence of a correct diagnosis. Judge the mechanism, not
the tone.
2. If the ground truth explicitly states that a certain category of fix is known to be
insufficient (e.g. "this fix only moves the threshold, it doesn't address the underlying
flaw"), and the agent proposes exactly that category of fix, grade it "partial" at best, even
if the agent's fix is well-reasoned and internally consistent.

Output strictly as JSON, no other text:
{
  "bucket": "correct" | "partial" | "wrong",
  "justification": "<one sentence, specific to this case, citing what the agent got right or wrong — not a generic restatement of the bucket definition>"
}
"""

JUDGE_USER_TEMPLATE = """GROUND TRUTH:
Root cause: {expected_root_cause}
Correct fix direction: {expected_fix_direction}

AGENT OUTPUT:
Investigation summary: {agent_investigation_summary}
Proposed fix: {agent_proposed_change}
"""