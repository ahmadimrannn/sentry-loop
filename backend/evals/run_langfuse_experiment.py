import time
from langfuse import get_client
from evals.eval_task import sentryloop_eval_task
from evals.judge_prompt import JUDGE_SYSTEM_PROMPT, JUDGE_USER_TEMPLATE, JUDGE_PROMPT_VERSION
from config.llm import call_judge_llm
import json

langfuse = get_client()

BUCKET_TO_SCORE = {"correct": 1.0, "partial": 0.5, "wrong": 0.0}
SECONDS_BETWEEN_JUDGE_CALLS = 15


def judge_evaluator(input, output, expected_output, **kwargs):
    """
    Evaluator function passed to run_experiment. Called once per dataset
    item after task() produces output. Must return a score dict — value
    here is numeric (0/0.5/1) so Langfuse can aggregate/chart it, with
    the judge's bucket label and justification preserved in metadata/comment.
    """
    user_prompt = JUDGE_USER_TEMPLATE.format(
        expected_root_cause=expected_output["expected_root_cause"],
        expected_fix_direction=expected_output["expected_fix_direction"],
        agent_investigation_summary=output.get("investigation_summary", ""),
        agent_proposed_change=output.get("proposed_change", ""),
    )
 
    raw_response = None
    last_error = None
    for attempt in range(1, 4):
        try:
            time.sleep(SECONDS_BETWEEN_JUDGE_CALLS)  # rate-limit protection, before every attempt
            raw_response = call_judge_llm(JUDGE_SYSTEM_PROMPT, user_prompt)
            break
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            if "rate_limit" in error_str or "429" in error_str:
                wait = 20 * attempt
                print(f"  Judge rate limited (attempt {attempt}/3), waiting {wait}s...")
                time.sleep(wait)
            else:
                raise
 
    if raw_response is None:
        return {
            "name": f"judge_verdict_{JUDGE_PROMPT_VERSION}",
            "value": None,
            "comment": f"Judge call failed after retries: {last_error}",
        }
 
    try:
        verdict = json.loads(raw_response)
        bucket = verdict.get("bucket")
        justification = verdict.get("justification")
    except json.JSONDecodeError:
        bucket = None
        justification = f"Judge returned non-JSON: {raw_response[:200]}"
 
    return {
        "name": f"judge_verdict_{JUDGE_PROMPT_VERSION}",
        "value": BUCKET_TO_SCORE.get(bucket),
        "comment": f"[{bucket}] {justification}",
    }
 
 
def main():
    dataset = langfuse.get_dataset("sentryloop-incidents")
 
    result = langfuse.run_experiment(
        name=f"sentryloop-incidents-judge-{JUDGE_PROMPT_VERSION}",
        data=dataset.items,
        task=sentryloop_eval_task,
        evaluators=[judge_evaluator],
    )
 
    print(result.format())
    print(f"\nDataset run URL: {getattr(result, 'dataset_run_url', 'check Langfuse UI')}")
 
 
if __name__ == "__main__":
    main()
