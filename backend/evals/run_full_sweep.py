import json
from datetime import datetime, timezone
from langfuse import Langfuse
from evals.eval_task import sentryloop_eval_task

langfuse = Langfuse()

OUTPUT_PATH = "evals/sweep_results_new_prompts.json"

def main():
    dataset = langfuse.get_dataset("sentryloop-incidents")

    results = []
    for item in dataset.items:
        case_id = item.metadata.get("id") if item.metadata else "unknown"
        print(f"\n{'=' * 60}")
        print(f"Running case: {case_id}")
        print(f"{'=' * 60}")

        try:
            output = sentryloop_eval_task(item)
        except Exception as e:
            print(f"CASE {case_id} FAILED TO RUN: {e}")
            output = {"error": str(e)}

        record = {
            "case_id": case_id,
            "input": item.input,
            "expected_output": item.expected_output,
            "actual_investigation_summary": output.get("investigation_summary", ""),
            "actual_proposed_change": output.get("proposed_change", ""),
            "step_count": output.get("step_count"),
            "reached_via": output.get("reached_via"),
            "error": output.get("error"),
            "your_blind_label": None, # Must be filled with hand before running the judge so you understand yourself first 
            "your_blind_justification": None, # Must be filled with hand before running the judge so you understand yourself first 
        }
        results.append(record)

        print(f"investigation_summary: {record['actual_investigation_summary'][:200]}...")
        print(f"proposed_change: {record['actual_proposed_change'][:200]}...")
        print(f"step_count: {record['step_count']}  reached_via: {record['reached_via']}")

    with open(OUTPUT_PATH, "w") as f:
        json.dump(
            {"run_at": datetime.now(timezone.utc).isoformat(), "results": results},
            f,
            indent=2,
        )

    print(f"\n{'=' * 60}")
    print(f"Saved {len(results)} raw results to {OUTPUT_PATH}")
    print("Next: open that file and fill in your_blind_label / your_blind_justification")
    print("for all 8 cases BEFORE running the judge.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()