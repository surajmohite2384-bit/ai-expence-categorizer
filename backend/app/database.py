import os
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv
import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment configuration from backend/.env or parent .env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "ai_expense_categorizer")

def ensure_database_exists():
    """Ensure the target MySQL database exists before creating tables."""
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            charset="utf8mb4",
        )
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        connection.commit()
        connection.close()
    except Exception as error:
        # If access is denied or server is unreachable, log helpful instruction
        print(f"[MySQL Configuration Notice] {error}")

# Run database creation check
ensure_database_exists()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    encoded_password = quote_plus(DB_PASSWORD)
    DATABASE_URL = (
        f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()