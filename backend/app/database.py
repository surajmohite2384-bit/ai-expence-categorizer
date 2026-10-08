import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import declarative_base, sessionmaker


backend_env = Path(__file__).resolve().parent.parent / ".env"
root_env = backend_env.parent.parent / ".env"
load_dotenv(backend_env)
load_dotenv(root_env)

configured_url = os.getenv("DATABASE_URL")
if configured_url:
    database_url = make_url(configured_url)
    if database_url.drivername != "mysql+pymysql":
        raise ValueError("DATABASE_URL must use the MySQL PyMySQL driver (mysql+pymysql://...).")
    if not database_url.database:
        raise ValueError("DATABASE_URL must include a MySQL database name.")
else:
    database_url = URL.create(
        drivername="mysql+pymysql",
        username=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "ai_expense_categorizer"),
    )

engine = create_engine(
    database_url,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_timeout=30,
    connect_args={"charset": "utf8mb4", "connect_timeout": 10},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()
