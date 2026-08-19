from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from dotenv import load_dotenv
import os

load_dotenv()

POSTGRES_URI = os.getenv("POSTGRES_URI")

pool = ConnectionPool(
  conninfo=POSTGRES_URI, 
  max_size=5, 
  kwargs={
    "autocommit": True, 
    "row_factory": dict_row
  }
)


