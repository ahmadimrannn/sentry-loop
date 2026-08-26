import os
import numpy as np
from huggingface_hub import InferenceClient
from utils.resilience import with_resilience
from dotenv import load_dotenv

load_dotenv()

_client = InferenceClient(token=os.getenv("HF_TOKEN"))
_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

@with_resilience()
def get_embedding(text: str) -> list[float]:
    raw = _client.feature_extraction(text, model=_MODEL)
    vector = np.array(raw, dtype=float)

    if vector.ndim > 1:
        vector = vector.mean(axis=0)

    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector.tolist()

if __name__ == "__main__":
    result = get_embedding("my name is ahmad")
    print(result)