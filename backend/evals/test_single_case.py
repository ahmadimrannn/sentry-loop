from langfuse import Langfuse
from evals.eval_task import sentryloop_eval_task
import uuid


langfuse = Langfuse()

CASE_ID_TO_TEST = "lumen-06"  # change to test a different case


def main():
    dataset = langfuse.get_dataset("sentryloop-incidents")

    # find the one item matching CASE_ID_TO_TEST
    target_item = None
    for item in dataset.items:
        item_id = item.metadata.get("id") if item.metadata else None
        if item_id == CASE_ID_TO_TEST:
            target_item = item
            break

    if target_item is None:
        print(f"No dataset item found with metadata.id == {CASE_ID_TO_TEST!r}")
        print("Available item metadata:")
        for item in dataset.items:
            print(f"  - {item.metadata}")
        return

    print(f"Running case: {CASE_ID_TO_TEST}")
    print(f"input: {target_item.input}")
    print(f"expected_output: {target_item.expected_output}")
    print("-" * 60)

    debug_thread_id = f"eval-{CASE_ID_TO_TEST}-{uuid.uuid4().hex[:8]}"
    result = sentryloop_eval_task(target_item, thread_id_override=debug_thread_id)

    print("RAW RESULT:")
    for key, value in result.items():
        print(f"  {key}: {value!r}")

    print("-" * 60)
    if not result.get("investigation_summary"):
        print("WARNING: investigation_summary is empty — harness likely broken, don't proceed to full run")
    if not result.get("proposed_change"):
        print("WARNING: proposed_change is empty — check propose_fix_node / state field name")


if __name__ == "__main__":
    main()