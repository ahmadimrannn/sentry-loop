import json
import time
from evals.judge_prompt import JUDGE_SYSTEM_PROMPT, JUDGE_USER_TEMPLATE, JUDGE_PROMPT_VERSION
from config.llm import call_judge_llm

SWEEP_RESULTS_PATH = "evals/sweep_results.json"
JUDGE_OUTPUT_PATH = "evals/judge_results_v3.json"
SECONDS_BETWEEN_CALLS = 15
MAX_RETRIES = 3



def run_judge_on_case(case: dict) -> dict:
    user_prompt = JUDGE_USER_TEMPLATE.format(
        expected_root_cause=case["expected_output"]["expected_root_cause"],
        expected_fix_direction=case["expected_output"]["expected_fix_direction"],
        agent_investigation_summary=case["actual_investigation_summary"],
        agent_proposed_change=case["actual_proposed_change"],
    )
 
    raw_response = None
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            raw_response = call_judge_llm(JUDGE_SYSTEM_PROMPT, user_prompt)
            break
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            if "rate_limit" in error_str or "429" in error_str:
                wait = 20 * attempt  # widening backoff: 20s, 40s, 60s
                print(f"  Rate limited (attempt {attempt}/{MAX_RETRIES}), waiting {wait}s...")
                time.sleep(wait)
            else:
                raise  # not a rate-limit error, don't retry, surface it
 
    if raw_response is None:
        return {
            "case_id": case["case_id"],
            "bucket": None,
            "justification": None,
            "judge_error": f"Failed after {MAX_RETRIES} retries: {last_error}",
        }
 
    try:
        verdict = json.loads(raw_response)
    except json.JSONDecodeError:
        return {
            "case_id": case["case_id"],
            "bucket": None,
            "justification": None,
            "judge_error": f"Non-JSON judge response: {raw_response[:300]}",
        }
 
    return {
        "case_id": case["case_id"],
        "bucket": verdict.get("bucket"),
        "justification": verdict.get("justification"),
        "judge_error": None,
    }
 
 
def main():
    with open(SWEEP_RESULTS_PATH) as f:
        sweep = json.load(f)
 
    judge_results = []
    for i, case in enumerate(sweep["results"]):
        if i > 0:
            time.sleep(SECONDS_BETWEEN_CALLS)
        print(f"Judging {case['case_id']}...")
        result = run_judge_on_case(case)
        judge_results.append(result)

        blind = case.get("your_blind_label")
        match_marker = ""
        if blind is not None and result["bucket"] is not None:
            match_marker = " [MATCH]" if blind == result["bucket"] else f" [MISMATCH: you said {blind}]"
        print(f"  -> judge: {result['bucket']}{match_marker}")
        print(f"     {result['justification']}")
 
    with open(JUDGE_OUTPUT_PATH, "w") as f:
        json.dump(
            {
                "judge_prompt_version": JUDGE_PROMPT_VERSION,
                "results": judge_results,
            },
            f,
            indent=2,
        )
 
    # simple agreement summary — only meaningful if blind labels exist
    # for THIS run's cases (see warning at top of file)
    labeled = [
        (c["your_blind_label"], j["bucket"])
        for c, j in zip(sweep["results"], judge_results)
        if c.get("your_blind_label") is not None and j["bucket"] is not None
    ]
    if labeled:
        agree = sum(1 for b, j in labeled if b == j)
        print(f"\nAgreement with your blind labels: {agree}/{len(labeled)}")
        if agree < len(labeled):
            print("Mismatches found — review before trusting the judge on ungraded cases.")
    else:
        print("\nNo blind labels present for this run — judge output saved but not validated.")
        print("Blind-label this run's cases before trusting these verdicts.")
 
    print(f"\nSaved judge verdicts to {JUDGE_OUTPUT_PATH}")


if __name__ == "__main__":
    main()