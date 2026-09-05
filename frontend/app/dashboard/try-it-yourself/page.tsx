/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    ShieldAlert,
    FileCode2,
    CheckCircle2,
    Loader2,
    RotateCcw,
    FlaskConical,
} from "lucide-react";
import { STEP_LABELS, POLL_INTERVAL_MS, EXAMPLE_PROMPTS, MAX_INPUT_LENGTH } from "@/constants";


function toReadableStep(raw: string): string {
    return STEP_LABELS[raw] ?? `Running: ${raw.replace(/_/g, " ")}`;
}

function formatReachedVia(raw: string): string {
    switch (raw) {
        case "step_limit_exceeded":
            return "Step limit reached";
        case "confident_enough_evidence_gathered":
            return "Confident evidence gathered";
        case "didnt_learn_something_new":
            return "No new information found";
        default:
            return raw.replace(/_/g, " ");
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TryItYourselfPage() {
    const [pageState, setPageState] = useState<PageState>("idle");
    const [incident, setIncident] = useState("");
    const [service, setService] = useState<Service>("lumen");
    const [steps, setSteps] = useState<StepSnapshot[]>([]);
    const [summary, setSummary] = useState<string | null>(null);
    const [proposedChange, setProposedChange] = useState<string | null>(null);
    const [reachedVia, setReachedVia] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const threadRef = useRef<string | null>(null);

    // ── Polling ────────────────────────────────────────────────────────────────

    const stopPolling = useCallback(() => {
        if (pollRef.current !== null) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const handlePollResponse = useCallback(
        (data: StatusResponse) => {
            // Accumulate steps — only add a new entry when step_count advances
            if (data.checked_this_step) {
                setSteps((prev) => {
                    const alreadyRecorded = prev.some((s) => s.stepCount === data.step_count);
                    if (alreadyRecorded) return prev;
                    return [
                        ...prev,
                        {
                            stepCount: data.step_count,
                            label: toReadableStep(data.checked_this_step!),
                            severities: data.severities_tried ?? [],
                            routes: data.routes_tried ?? [],
                        },
                    ];
                });
            }

            if (data.investigation_summary) {
                setSummary(data.investigation_summary);
            }

            if (data.done) {
                stopPolling();
                if (data.error) {
                    const safe =
                        data.error.length > 200 ? data.error.slice(0, 200) + "…" : data.error;
                    setErrorMsg(safe);
                    setPageState("error");
                } else {
                    setProposedChange(data.proposed_change ?? null);
                    setReachedVia(data.reached_via ?? null);
                    setPageState("done");
                }
            }
        },
        [stopPolling]
    );

    const startPolling = useCallback(
        (thread_id: string) => {
            const poll = async () => {
                try {
                    const res = await fetch(`/api/investigate/status/${thread_id}`);
                    if (res.status === 404) {
                        stopPolling();
                        setErrorMsg(
                            "The investigation run could not be found. It may have failed to start."
                        );
                        setPageState("error");
                        return;
                    }
                    if (!res.ok) {
                        // Non-fatal transient error; keep polling
                        return;
                    }
                    const data: StatusResponse = await res.json();
                    handlePollResponse(data);
                } catch {
                    // Network hiccup — keep polling
                }
            };

            poll(); // Immediate first poll
            pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
        },
        [stopPolling, handlePollResponse]
    );

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!incident.trim() || pageState === "running") return;

        setPageState("running");
        setSteps([]);
        setSummary(null);
        setProposedChange(null);
        setReachedVia(null);
        setErrorMsg(null);
        threadRef.current = null;

        try {
            const res = await fetch("/api/investigate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ incident: incident.trim(), service }),
            });

            if (res.status === 429) {
                setPageState("ratelimit");
                return;
            }

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const msg: string = body?.error ?? "Something went wrong starting the run.";
                setErrorMsg(msg.length > 200 ? msg.slice(0, 200) + "…" : msg);
                setPageState("error");
                return;
            }

            const { thread_id } = await res.json();
            threadRef.current = thread_id;
            startPolling(thread_id);
        } catch {
            setErrorMsg("Network error — could not reach the backend.");
            setPageState("error");
        }
    };

    const handleReset = () => {
        stopPolling();
        setPageState("idle");
        setSteps([]);
        setSummary(null);
        setProposedChange(null);
        setReachedVia(null);
        setErrorMsg(null);
        threadRef.current = null;
        // Keep the last input/service so the user can tweak and resubmit
    };

    // Cleanup on unmount
    useEffect(() => () => stopPolling(), [stopPolling]);

    // ─── Render ───────────────────────────────────────────────────────────────

    const isRunning = pageState === "running";
    const isTerminal = pageState === "done" || pageState === "error" || pageState === "ratelimit";
    const currentStepCount = steps.length > 0 ? steps[steps.length - 1].stepCount : null;

    return (
        <div className="space-y-6 max-w-3xl font-inter">
            {/* ── Page header ── */}
            <div className="pb-2 border-b border-border">
                <h1 className="font-geist text-3xl tracking-tighter text-foreground">
                    Try It Yourself
                </h1>
                <p className="text-md text-muted-foreground mt-1 font-inter">
                    Runs the real agent, live, against real historical event data for a
                    real service — not a canned demo.
                </p>
            </div>

            {/* ── Example prompt chips ── */}
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase font-geist">
                    Example incidents
                </p>
                <div className="flex flex-col gap-2">
                    {EXAMPLE_PROMPTS.map((p, i) => (
                        <button
                            key={i}
                            type="button"
                            disabled={isRunning}
                            onClick={() => {
                                setIncident(p.text);
                                setService(p.service);
                            }}
                            className="group text-left rounded-md border border-border bg-card px-4.5 py-2.5 text-sm text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
                        >
                            <span className="font-mono text-[14px] font-semibold text-muted-foreground uppercase tracking-wide mr-1.5">
                                {p.service}
                            </span>
                            {p.text}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Input form ── */}
            <div className="space-t-3">
                <div className="space-t-1.5">
                    <label
                        htmlFor="incident-input"
                        className="text-md font-medium font-geist tracking-tight text-foreground"
                    >
                        Incident description
                    </label>
                    <textarea
                        id="incident-input"
                        value={incident}
                        onChange={(e) =>
                            setIncident(e.target.value.slice(0, MAX_INPUT_LENGTH))
                        }
                        disabled={isRunning}
                        placeholder="Describe the incident signal — error codes, endpoints, timing, symptoms…"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 font-inter leading-relaxed"
                    />
                    <div className="text-right text-[10px] text-muted-foreground font-geist">
                        {incident.length}/{MAX_INPUT_LENGTH}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">
                            Service
                        </label>
                        <Select
                            value={service}
                            onValueChange={(v: string | null) => {
                                if (v) setService(v as Service);
                            }}
                            disabled={isRunning}
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={"px-2 py-2"}>
                                <SelectItem value="lumen">Lumen</SelectItem>
                                <SelectItem value="cognilead">CogniLead</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* CTA with BorderBeam */}
                    <div className="relative overflow-hidden rounded-lg mt-5">
                        <Button
                            id="submit-investigation"
                            onClick={handleSubmit}
                            disabled={isRunning || !incident.trim()}
                            className="relative z-10 gap-2 px-5 h-9 font-geist text-sm"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Investigating…
                                </>
                            ) : (
                                <>
                                    <FlaskConical className="size-3.5" />
                                    Run Investigation
                                </>
                            )}
                        </Button>
                        {!isRunning && (
                            <BorderBeam
                                size={80}
                                duration={5}
                                colorFrom="#6366f1"
                                colorTo="#a855f7"
                                borderWidth={1.5}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Progress — running or done with accumulated steps ── */}
            {(isRunning || isTerminal) && steps.length > 0 && (
                <div className="space-y-4">
                    <p className="text-md font-medium text-muted-foreground uppercase font-geist">
                        Investigation progress
                    </p>

                    <ol className="space-y-1">
                        {steps.map((step, idx) => {
                            const isCurrent = isRunning && idx === steps.length - 1;
                            const isDone = !isCurrent;

                            return (
                                <li key={idx} className="flex items-start gap-3">
                                    {/* Status indicator */}
                                    <div className="mt-0.5 shrink-0">
                                        {isDone ? (
                                            <CheckCircle2 className="size-4 text-foreground/60" />
                                        ) : (
                                            <span className="flex size-4 items-center justify-center">
                                                <span className="size-2 rounded-full bg-foreground animate-pulse" />
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1 min-w-0">
                                        <p
                                            className={`text-md leading-snug ${isCurrent
                                                ? "text-foreground font-medium"
                                                : "text-muted-foreground"
                                                }`}
                                        >
                                            <span className="font-mono text-[14px] mr-1.5 opacity-50">
                                                {step.stepCount}.
                                            </span>
                                            {step.label}
                                        </p>

                                        {/* Severity tags */}
                                        {step.severities.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {step.severities.map((s) => (
                                                    <span
                                                        key={s}
                                                        className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-[14px] text-muted-foreground"
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Route tags */}
                                        {step.routes.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {step.routes.map((r) => (
                                                    <span
                                                        key={r}
                                                        className="inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                                                    >
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}

                        {/* "still running" trailing indicator when no step has changed yet */}
                        {isRunning && steps.length === 0 && (
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex size-4 items-center justify-center">
                                    <span className="size-2 rounded-full bg-foreground animate-pulse" />
                                </span>
                                Starting…
                            </li>
                        )}
                    </ol>

                    {/* Running summary prose */}
                    {summary && (
                        <div className="space-y-1.5">
                            <p className="text-md font-medium text-muted-foreground uppercase font-geist">
                                Running summary
                            </p>
                            <div className="rounded-lg border border-border bg-card p-3.5 text-sm leading-relaxed text-foreground font-inter whitespace-pre-wrap">
                                {summary}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Terminal: starting (no steps yet, running) ── */}
            {isRunning && steps.length === 0 && (
                <ol className="space-y-1">
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex size-4 items-center justify-center">
                            <span className="size-2 rounded-full bg-foreground animate-pulse" />
                        </span>
                        Starting…
                    </li>
                </ol>
            )}

            {/* ── Terminal: done ── */}
            {pageState === "done" && (
                <div className="space-y-5">
                    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-5 text-foreground/60" />
                                <h2 className="font-geist text-lg font-semibold  text-foreground">
                                    Run complete
                                </h2>
                            </div>
                            {reachedVia && (
                                <Badge variant="secondary" className="font-mono text-[14px] px-4 py-3">
                                    {formatReachedVia(reachedVia)}
                                </Badge>
                            )}
                        </div>

                        {/* Investigation summary */}
                        {summary && (
                            <div className="space-y-1.5">
                                <h3 className="font-geist text-md font-semibold  text-foreground flex items-center gap-1.5">
                                    <ShieldAlert className="size-4.5 text-neutral-500" />
                                    Investigation Summary
                                </h3>
                                <div className="rounded-lg border border-border bg-background p-3.5 text-sm leading-relaxed text-foreground font-inter whitespace-pre-wrap">
                                    {summary}
                                </div>
                            </div>
                        )}

                        {/* Proposed change */}
                        {proposedChange && (
                            <div className="space-y-1.5">
                                <h3 className="font-geist text-md font-semibold  text-foreground flex items-center gap-1.5">
                                    <FileCode2 className="size-4.5 text-neutral-500" />
                                    Proposed Change
                                </h3>
                                <div className="rounded-lg border border-border bg-muted/30 p-3.5 text-sm leading-relaxed text-foreground font-mono whitespace-pre-wrap">
                                    {proposedChange}
                                </div>
                            </div>
                        )}

                        <p className="text-sm text-muted-foreground leading-relaxed font-inter font-medium border-t border-border pt-3">
                            NOTE: In production, this proposal would now be emailed for human
                            review and can only be approved or rejected by a person — this
                            demo stops here since a public demo can&apos;t wait on the project
                            owner&apos;s inbox.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                        <RotateCcw className="size-3.5" />
                        Try another
                    </button>
                </div>
            )}

            {/* ── Terminal: error ── */}
            {pageState === "error" && (
                <div className="space-y-3">
                    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                        <p className="font-geist text-sm font-semibold text-foreground">
                            Something went wrong on this run
                        </p>
                        {errorMsg && (
                            <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                                {errorMsg}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                        <RotateCcw className="size-3.5" />
                        Try another
                    </button>
                </div>
            )}

            {/* ── Terminal: rate limited ── */}
            {pageState === "ratelimit" && (
                <div className="space-y-3">
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-foreground font-inter">
                            The agent is rate-limited to 5 demo runs per hour per IP. Try
                            again later.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                        <RotateCcw className="size-3.5" />
                        Try another
                    </button>
                </div>
            )}
        </div>
    );
}
