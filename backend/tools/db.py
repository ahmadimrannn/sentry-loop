from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from dotenv import load_dotenv
from pgvector.psycopg import register_vector
import os

load_dotenv()

POSTGRES_URI = os.getenv("POSTGRES_URI")

def configure_connection(conn):
    register_vector(conn)

pool = ConnectionPool(
  conninfo=POSTGRES_URI, 
  max_size=5,
  max_idle=300, 
  kwargs={
    "autocommit": True, 
    "row_factory": dict_row
  },
  check=ConnectionPool.check_connection,
  configure=configure_connection,
)


