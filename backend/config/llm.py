from config.settings import LLM_MODEL_NAME
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from config.settings import JUDGE_MODEL
from langchain_groq import ChatGroq

load_dotenv()

model = ChatGoogleGenerativeAI(
  model=LLM_MODEL_NAME,
)

llm = ChatGroq(
    model=JUDGE_MODEL,
    temperature=0,
    model_kwargs={"response_format": {"type": "json_object"}}
)

def call_judge_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Calls the judge model via Groq (OpenAI-compatible API, free tier).
    Different model family from the agent under test (Gemini) to avoid
    self-preference bias.
    """

    prompt = [
        ("system", system_prompt),
        ("human", user_prompt)
    ]

    res = llm.invoke(prompt)        
    response = res.content
    return response