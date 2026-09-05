# SentryLoop

An autonomous incident investigation agent that reads real production logs, forms a root cause hypothesis, tests it against evidence, and drafts a fix proposal for human approval. It never touches production. It only investigates and proposes.

Think of it as an AI on call engineer that wakes up when something breaks, digs through the logs the way a real engineer would, and leaves a written report on your desk instead of pushing a fix itself.

## Deployment

Frontend: https://sentryloop.vercel.app
Backend: https://sentryloop-backend.vercel.app

Deployed as two separate Vercel projects, frontend and backend, rather than one combined deployment.

## What This Actually Does

You give SentryLoop an error or anomaly signal from a real system. It then:

1. Picks a tool (query the event log by severity or route, check aggregated metrics, check a service's health endpoint) based on what it currently knows.
2. Reads the real result back.
3. Updates a running hypothesis using the full evidence gathered so far, not just the newest finding.
4. Decides for itself whether it has enough to conclude, or whether it needs another step.
5. Once it stops, either because it is confident, because it hit a step limit, or because it stopped learning anything new, it writes a fix proposal and pauses.
6. A human gets an email with the investigation summary and the proposed fix, and clicks approve or reject. Nothing happens to any real system until that click.

There is no fixed number of steps. The agent decides when it has seen enough, the same way a person debugging a real incident does not follow a script, they follow the evidence.

## Why This Project Exists

I had two earlier projects, ClauseGuard (a contract review SaaS) and ApexTriage (a CRM integration tool), and I killed both of them. ClauseGuard was a fixed workflow wearing an agent costume, not something that actually made decisions. ApexTriage turned into a pile of one-off integrations instead of a coherent product. Neither one taught me the thing I actually wanted to get good at: building agents with a real dynamic loop, a real harness, and real context engineering, where the agent's behavior at step 7 depends on what it learned at steps 1 through 6, not on a diagram I drew in advance.

SentryLoop was built specifically to force that skill. The investigation loop is not scripted. The stopping condition is not a fixed counter. The context the model sees is not the raw log dump, it is a compressed, rewritten summary that the agent maintains about itself, step by step.

The other decision that shaped this project: the data is real. SentryLoop investigates actual incidents from my own deployed systems, Lumen (a multi-node LangGraph research pipeline on Railway) and CogniLead (a lead qualification agent on Vercel), using their real logs and the real documented bugs from Lumen's own bug log as ground truth for evals. Nothing here is a synthetic demo dataset built to make the numbers look good.

## Specialties (what this project is actually good at)

**Genuinely variable-length investigation.** Most "agentic" demos run a fixed pipeline and call it a loop. SentryLoop's step count is not set anywhere. It is bounded by three real stop conditions checked in a specific order: a hard step cap as a safety net, an LLM-based confidence check that can stop the loop early even with unexplored leads left if the hypothesis is already well supported, and a no-new-information check as a last resort if the wording stops changing. Getting these three to agree with each other, instead of fighting each other, took real iteration (see the bugs section).

**Context that shrinks instead of grows.** The agent does not replay its entire evidence log into every prompt. After the second phase of work I moved to a single investigation_summary field, rewritten in full every step, capped at roughly 150 words with a hard backstop at 200. The raw evidence log still exists, but only as an audit trail nobody re-reads. This matters because naive full-replay context scales roughly quadratically with step count, and a 13-step investigation would otherwise be shoving a wall of text into every single call.

**Guardrails enforced at the database level, not just the prompt level.** The proposals table has a CHECK constraint that only allows the value pending_approval at insert time. The agent cannot write "approved" to its own proposal even if you somehow got a rogue prompt to try. Approval and rejection happen through a separate, single-use update path (WHERE status = 'pending_approval') that finds zero rows and fails loudly on a second attempt. This is not a policy the model is asked to follow. It is a constraint the database enforces regardless of what the model does.

**Honest failure instead of fabricated confidence.** When the loop hits the step cap without reaching a confident conclusion, it does not dress up a guess as a fix. It routes into the same proposal node as a successful investigation, but the resulting proposal is an honest "inconclusive, recommend manual review." I verified this is real prompt behavior with actual forced runs, not something I assumed would happen.

**Memory that argues against itself, not just for itself.** Past incidents are retrieved automatically at the start of every run using pgvector similarity search over past investigation summaries. The retrieval is outcome-labeled, meaning a past incident that got rejected as a false lead is fed back in as a false lead, not as evidence supporting the same conclusion again. I specifically tested this with a false-lead case to confirm the system does not anchor on its own past mistakes.

## Moat

I want to be straight about what this is and is not. This is a solo capstone project, not a funded startup, so "moat" here means real technical differentiation from the typical portfolio agent project, not a competitive market position.

What actually separates this from a weekend agent demo:

- **Ground truth is real, not synthetic.** The eval set is eight hand-audited real bugs pulled from Lumen's own documented bug history, seeded as real rows in a real Postgres events table, run through the real pipeline. A synthetic dataset can be shaped to make your agent look good. A dataset built from bugs you already fixed and already know the true root cause of cannot be gamed that way, and it already caught three more real production bugs in SentryLoop itself while I was building the eval harness (see below).
- **The agent has no path to touching production.** Every tool is read-only by contract. propose_fix can only ever produce a draft. This was a design decision made before a single line of the tool harness was written, not bolted on afterward.
- **The full proposal lifecycle is bounded.** A proposal cannot sit paused forever. It escalates through three reminder emails over roughly twelve days, and if nobody responds, it auto-rejects rather than leaving a production question in permanent limbo. Race conditions between a human clicking and the reminder cron auto-rejecting at the same moment are handled explicitly.
- **The eval judge is validated, not assumed.** I built a canary test case specifically to check whether the judge model correctly grades a plausible-sounding but insufficient fix as partial or wrong, rather than rewarding it for sounding right. This came directly from a real Lumen bug where the "obvious" fix was documented as insufficient.

## Architecture

The core loop is a LangGraph StateGraph, not a manual while loop. It started as a manual while loop and was converted once Phase 5's Postgres checkpointing and interrupt and resume requirement made a real graph necessary.

```
classify_severity_node
        |
        v
retrieve_memory_node (pgvector similarity search over past incidents)
        |
        v
   decide_node <---------------------+
        |                            |
        v                            |
   execute_node (runs one tool)      |
        |                            |
        v                            |
  summarize_node (rewrites the       |
  investigation_summary)             |
        |                            |
        v                            |
  should continue? ------------------+  (loop back to decide_node)
        |
        v (stop condition met)
  route_after_summarize_node
  (records status_after_routing:
   step_limit_exceeded /
   confident_enough_evidence_gathered /
   didnt_learn_something_new)
        |
        v
  propose_fix_node
  (drafts fix, writes to proposals table,
   calls interrupt(), pauses)
        |
        v
  [ human clicks approve/reject via email,
    or cron auto-rejects after 3 unanswered
    reminders ]
        |
        v
  finalize_node
  (records human decision, writes to
   incidents table for future memory retrieval)
```

Four tools, all wrapped in a shared retry-with-backoff decorator (utils/resilience.py) that raises a custom ToolExecutionError after max attempts:

- **query_events** — reads the real event log, filtered by service, severity, and route
- **query_metrics** — aggregated event counts
- **checks_service_status** — hits the target service's real health endpoint
- **propose_fix** — drafts the fix proposal, gated behind human approval, never applies anything

Data lives in Neon Postgres with pgvector enabled. Both Lumen and CogniLead expose a /health endpoint that checks real database connectivity through the app's own connection pool, not a separate one built just for SentryLoop.

## The Investigation Loop, In Detail

Each step, the agent picks a tool based on what it currently knows, not a predetermined sequence. Severity and route choices are forced against real known values pulled live from the database (get_known_routes queries the actual events table) rather than trusting the model's free-text pick or its own self-reported claim about an "unexplored lead." This closed two separate instances I found during testing where the model claimed progress that was not real.

Every tool call and every LLM call is wrapped in try and except. A failed tool call gets logged into the evidence log as a real finding, not treated as a crash. I verified this against a real injected failure (renamed a function the tool depended on) and confirmed the loop survived and kept investigating instead of dying.

The stop conditions are checked in this order every step:

1. Hard step cap. A safety net, not the primary mechanism.
2. LLM confidence and evidence-sufficiency check. Can stop the loop early, even with unexplored routes left, if the hypothesis is already well supported by what has been gathered.
3. No-new-information check. If the wording of the hypothesis stops meaningfully changing between steps, that is treated as a signal the agent has plateaued.

I confirmed through real testing that the confidence check settling on two well-supported, genuinely unrelated findings (and correctly not forcing a link between them) is intended behavior, not premature stopping that needs fixing.

## Context Engineering

The investigation_summary field is rewritten in full every step, target roughly 150 words, hard max 200. It fully replaces the raw evidence log for anything shown to future prompts. The evidence log is kept only as an internal audit trail.

The compaction instruction has a concrete supersession rule: drop an earlier vague finding once a later, more specific finding fully explains it, but never merge two unrelated findings into a false cause and effect link. The original instruction was a vague "drop what no longer matters," which was not specific enough to produce consistent behavior.

I verified with a real forced 13-step run that word count tapers and re-compresses under repeated rewrites (97 to 139 words, then settling in the 120s) instead of climbing unbounded, and that a genuine duplicate finding, the same health check 404 discovered independently at step 1 through a severity filter and again at step 12 through a route filter, got correctly collapsed into a single statement instead of restated twice.

There is a code-level hard backstop, SUMMARY_WORD_LIMIT=200, that truncates and logs a warning if the model's summary ever exceeds the stated max, rather than trusting prompt instruction-following alone to hold under pressure.

## Guardrails and Human Approval

Nothing SentryLoop finds is ever applied automatically. propose_fix_node drafts a fix, writes it to the proposals table, and calls interrupt() to pause the graph. A human gets an email through Resend with signed HMAC approve and reject links (proposal id, decision, and expiry, verified with constant-time comparison to prevent timing attacks) and the graph only resumes once that click comes back through a FastAPI webhook.

The proposals table enforces single-use decisions at the database level. update_proposal_status only updates a row WHERE status = 'pending_approval'. A second attempt to approve or reject an already-decided proposal matches zero rows and raises an error instead of silently succeeding twice.

A proposal cannot sit paused forever. A daily Vercel cron job checks for proposals still pending after 3 days and resends the email as a reminder with fresh tokens. After 3 reminders with no response, the next cron run auto-rejects the proposal, actually resumes the paused graph thread with Command(resume="reject") so the graph reaches a real end state instead of leaving the database and the paused thread disagreeing with each other, and sends a final notice email with no buttons since the decision is already final. If a human clicks approve or reject in the same window the cron is auto-rejecting the same proposal, the loser of that race hits the existing single-use guard and is skipped cleanly rather than crashing the job or overriding the real human decision.

Full lifecycle, bounded end to end: original email at day 0, reminder at roughly day 3, reminder at roughly day 6, reminder at roughly day 9, auto-reject at roughly day 12 if still unanswered.

## Persistent Memory

Past incidents are retrieved automatically at the start of every run, not chosen by the agent as an optional tool. This was a deliberate choice after noticing that query_metrics, a tool the agent could choose to call, had never actually been picked in a real run. Making retrieval automatic instead of optional was the more reliable path.

Embeddings use sentence-transformers/all-MiniLM-L6-v2, 384 dimensions, run locally rather than through a hosted embedding API. This meant opting into Vercel's Fluid Compute with large function bundles (up to 5GB) to fit torch and sentence-transformers, a real infrastructure tradeoff made to avoid an external embedding dependency.

The incidents table keeps embedded_text separate from investigation_summary specifically so the exact string that was embedded stays traceable if the embedding strategy ever changes later.

The similarity threshold, MAX_DISTANCE, was tuned against real data rather than guessed and left alone. Related incidents in real testing landed between 0.208 and 0.386 distance. A deliberately unrelated incident, tested later once there were enough real rows to test against, landed between 0.677 and 0.824. That is a wide, clean gap, and MAX_DISTANCE=0.5 sits safely in the middle of it. The default guess turned out to be correct, but I did not treat that as good enough without the actual unrelated-case data point to confirm it.

## Evals and Observability

Langfuse handles tracing. The eval dataset is eight real, hand-audited bugs, six from Lumen and two from CogniLead, seeded as real rows with explicit timestamps directly into the Neon events table, then read back through the real query_events tool to confirm the seeding actually worked end to end rather than assuming it did.

The judge prompt is a three-bucket grader (correct, partial, wrong) with a forced one-line justification and an explicit rule that a plausible-sounding fix matching a fix direction the ground truth already flags as insufficient can only ever grade partial at most, never correct. This rule exists because of a real Lumen bug, an averaging and blending exploit in evaluate_results.py that was already documented as unsolved. That specific case is now the designated canary test for the judge itself: if the judge ever grades "just raise the threshold" as correct for that case, the judge is broken, not the agent.

The judge prompt lives in the repo as a versioned file with a version constant passed into Langfuse experiment metadata, not inside Langfuse's own prompt editor. That keeps it in git history and testable locally during blind-label validation, instead of living only inside a UI.

## Real Bugs I Hit and How I Fixed Them

This is the part most READMEs skip. These are real bugs, found through real testing, not a curated highlight reel.

**Instrumentation phase**
- CogniLead's /leads/failed endpoint threw a KeyError because it queried a field that was never actually selected in the SQL query. Fixed by selecting the field.
- Lumen's conflict_detector.py silently forwarded malformed LLM output downstream to report_writer despite already computing a parse_failed flag internally. The flag existed and was simply never checked. Fixed by logging it as a real event (conflicts_analysis_failure) instead of letting it pass through silently.
- supervisor.py collapsed three genuinely different situations into one event type, making it impossible to tell them apart later. Split into three distinct events and replaced a bare print() with a real logged event.

**Tool harness phase**
- Neon's pooled connections would silently drop when idle, causing tool calls to fail with confusing errors. Fixed with connection health checks in the shared db module.
- CogniLead's resume_graph.py called Command(resume=...) without first checking whether a checkpoint actually existed for that thread_id, producing a confusing KeyError when someone tried to resume a thread that was never paused. Fixed by adding a graph.get_state(config) check before attempting the resume.

**Investigation loop phase**
- query_events called without service or time scoping once pulled in unrelated historical events and produced a false "no failures found" conclusion. Fixed by forcing real scoping on every call.
- get_known_routes was being called with the raw, unstripped, uncased service argument instead of the normalized version, and silently returned zero routes every time. This is the kind of bug that fails quietly, no crash, just wrong empty results, which makes it worse than a bug that throws an error.
- The hypothesis-update prompt was reading the evidence log from before the current step's findings were appended, instead of the version that included them, causing early steps to claim "no evidence" while real evidence sat right there unused. Fixed by reading the post-append local copy instead of the stale one.

**Context engineering and graph conversion phase**
- The rewritten investigation_summary was generated correctly but never actually included in the function's returned dict, so it silently never persisted across steps. The rewrite was happening and then being thrown away every single time.
- A second bug in the same file read combined.has_unexplored_lead without a guard, which would crash with an AttributeError the instant the summarize or hypothesize LLM call failed, completely bypassing an existing safe-fallback path sitting right next to it in the code.
- During the manual-loop-to-StateGraph conversion, execute_node's severity and route branches were returning the full accumulated list instead of just the newly chosen item. LangGraph's operator.add reducer was already handling accumulation, so this double-counted every entry, produced real duplicates in the evidence log, and silently stalled the graph from ever reaching the routes branch. Fixed by returning only the new item per step and letting the reducer do its job.
- Printing state during testing after the conversion showed what looked like lost evidence from earlier steps. The actual bug was that .stream() by default only yields each node's own partial delta, not the full merged state. Switching to stream_mode="values" fixed the display, and confirmed the underlying state was correct the whole time, the bug was in how I was looking at it, not in the graph itself.

**Guardrails and approval phase**
- update_proposal_status was originally wrapped in the same shared retry decorator every other tool used. Retrying an intentional "already decided" rejection changed the exception type by the time it reached the webhook, so the webhook's except ValueError clause did not catch it, and a legitimate business rule violation surfaced as a raw, unhandled 500 error instead of the intended 409. Fixed by removing the retry wrapper from this specific function, since a permanent rejection is not a transient failure worth retrying, and widened the webhook's except clause as a backstop.
- The root main.py file was originally uv's placeholder scaffold file, completely unrelated to any real endpoint. Vercel's Python framework auto-detection specifically scans for a top-level app instance in root-level files like main.py or app.py. Replaced it with a real FastAPI app and removed the old file-based route that had been living somewhere else.

**Persistent memory phase**
- The reached_via column kept coming back empty. Root cause: route_after_summarize was a LangGraph conditional edge function that mutated state directly instead of returning a state update. Conditional edges are read-only by contract in LangGraph and are never checkpointed, so the mutation was silently lost every time the graph crossed a pause and resume boundary, which every run does before reaching finalize_node. Fixed by converting it into a real node that returns Command(update=..., goto=...), and rewired the graph from add_conditional_edges to a plain edge plus node registration. There was also a second, independent path to the exact same empty-value bug: the except branch for a failed progress_llm.invoke() call routed straight to propose_fix without ever setting the field at all.
- Every SentryLoop error event had been silently failing to insert into the shared events table since the project started using it, visible only as console prints that nobody was watching, never stored anywhere queryable. Root cause: the events table's CHECK constraint predated SentryLoop, built only for Lumen and CogniLead, and simply did not include 'sentryloop' as an allowed service value. Fixed with an ALTER to widen the constraint. This one is worth sitting with, an entire category of the system's own errors was invisible for an unknown stretch of time, and the fix was one line, but finding it required actually going looking for why errors were only ever showing up in a terminal and nowhere else.

**Evals phase**
- A hardcoded 24-hour lookback window in query_events was silently hiding older real incidents from every investigation, which meant the agent could never have found certain real bugs no matter how good the loop logic was, because the data was never in reach to begin with.
- A stale-proposal cache bug in propose_fix_node meant that reusing a thread_id served back a cached first-draft proposal instead of regenerating a fresh one, which would have quietly broken the interrupt-replay guarantee under the wrong conditions.
- Neither summarize_node's nor propose_fix_node's prompt ever actually received the original incident text as an anchor. Without that anchor, investigations could drift onto other real-but-unrelated events happening in the same system at the same time. This is the same failure pattern already documented as bug #12 in Lumen's own bug history, query drift with no original-question anchor. Finding the identical failure mode in a second, unrelated project was a useful confirmation that it is a real, recurring class of bug and not a one-off mistake.

## Design Decisions and Tradeoffs

**Real data over synthetic data.** This made everything slower to set up and impossible to fake. It also meant every eval result meant something, because the ground truth came from bugs I had already lived through and fixed, not from a dataset shaped to flatter the system.

**Automatic memory retrieval instead of an agent-chosen tool.** query_metrics existed as a real, working, tested tool from early on and was never once chosen by the agent in a real run. Rather than trust that a useful capability would get picked when it mattered, memory retrieval was made automatic and injected at the start of every run. This trades a small amount of agent autonomy for reliability.

**Local embeddings over a hosted embedding API.** Chose sentence-transformers running locally, which meant opting into a larger, more expensive Vercel compute tier to fit the model bundle, over calling out to a hosted embedding service. This avoided an external dependency and a per-call cost, at the price of a heavier deployment footprint.

**Database-level guardrails over prompt-level guardrails.** CHECK constraints and single-use update guards do not care what the model was told to do. They are the actual reason nothing can be double-approved or self-approved, not the prompt's request that it not happen.

**Honest failure over confident-looking failure.** An inconclusive investigation produces an inconclusive proposal. This was a deliberate choice to prioritize trustworthiness over the system always appearing to have an answer.

**A capped, rewritten summary over full context replay.** Full replay is simpler to build and was the first version. It was replaced once it became clear it would scale roughly quadratically with step count on any investigation that ran long. The tradeoff is a small amount of information loss on every rewrite, made acceptable by the code-level word cap backstop and the explicit supersession rule that prevents unrelated findings from merging into false conclusions.

**Bounded proposal lifecycle over indefinite pending state.** A three-reminder, twelve-day auto-reject window means a forgotten email cannot leave a real incident in permanent limbo, at the cost of occasionally auto-rejecting something a busy human genuinely intended to review, just hadn't gotten to yet.

## Roadmap

What's planned next, in rough priority order:

- A dedicated automated test suite, scoped after the current phase work wraps up.
- A CI gate and an EVAL_MODE guard around the live email send path, so eval runs stay fully isolated from real notifications.
- Broader production-scale testing of the memory system as real, non-eval proposals accumulate in the incidents table over time.
- Continued tightening of the confidence and progress judgments that decide when the investigation loop stops, including exploring a lightweight non-LLM check alongside the current LLM-based one.
- Further validation of severity classification behavior on ambiguous incident text across a larger sample of real runs.

## Tech Stack

- **Orchestration:** LangGraph (StateGraph, conditional routing, Postgres checkpointing, interrupt and resume)
- **Database:** Neon Postgres with pgvector
- **Embeddings:** sentence-transformers/all-MiniLM-L6-v2, run locally
- **Backend:** FastAPI, deployed on Vercel
- **Frontend:** deployed separately on Vercel
- **Approval delivery:** Resend, HMAC-signed approve and reject links
- **Scheduling:** Vercel Cron, daily stale-proposal reminder and auto-reject job
- **Observability:** Langfuse
- **Monitored systems:** Lumen (Railway) and CogniLead (Vercel), both real, deployed, personally-built systems

## Status

Actively in progress. Phases 1 through 6 are complete. Phase 7 (evals and observability) has tracing done and evals declared done with known open items listed above. Phase 8 (real UI and deployment) is in progress.
