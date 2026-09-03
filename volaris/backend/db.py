import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "host": "localhost",
    "database": "volaris_db",
    "user": "postgres",
    "password": "toor",  
    "port": 5435,             
    "client_encoding": "WIN1252"
}

def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    
    conn.set_client_encoding('UTF8')
    return conn