from config.settings import LLM_MODEL_NAME
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

model = ChatGoogleGenerativeAI(
  model=LLM_MODEL_NAME
)