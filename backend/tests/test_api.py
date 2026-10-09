import os
import sys
from decimal import Decimal
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import Base
from app.models import Category, Expense, User, AIPrediction
from app.main import app, get_db, hash_password

# Setup isolated in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables and seed system categories before each test."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    categories = [
        "Food", "Groceries", "Shopping", "Transportation", "Entertainment",
        "Bills & Utilities", "Healthcare", "Education", "Travel", "Other"
    ]
    for cat in categories:
        if not db.query(Category).filter(Category.name == cat).first():
            db.add(Category(name=cat, description=f"Test {cat}"))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoints(client):
    """Verify health check returns valid JSON status."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "app" in data

    res_api = client.get("/api/health")
    assert res_api.status_code == 200
    assert res_api.json()["status"] == "ok"


def test_predict_category_heuristics(client):
    """Verify smart heuristic categorization works deterministically."""
    res = client.post("/predictCategory", json={
        "merchant": "Swiggy",
        "amount": 350.00,
        "description": "Lunch order",
        "payment_method": "UPI",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["category"] == "Food"
    assert data["confidence"] > 0
    assert "heuristic" in data["source"] or "gemini" in data["source"]


def test_predict_category_validation(client):
    """Verify invalid payloads to predictCategory are rejected with 422."""
    # Blank merchant
    res = client.post("/predictCategory", json={
        "merchant": "   ",
        "amount": 100,
    })
    assert res.status_code == 422

    # Negative amount
    res = client.post("/predictCategory", json={
        "merchant": "Uber",
        "amount": -50,
    })
    assert res.status_code == 422


def test_auth_signup_and_login(client):
    """Test user registration, duplicate checks, and login authentication."""
    # 1. Sign up user
    signup_res = client.post("/auth/signup", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123",
    })
    assert signup_res.status_code == 200
    user_data = signup_res.json()
    assert user_data["email"] == "test@example.com"
    assert "token" in user_data
    token = user_data["token"]
    assert len(token) > 20

    # 2. Reject duplicate email
    dup_res = client.post("/auth/signup", json={
        "name": "Duplicate User",
        "email": "test@example.com",
        "password": "anotherpassword",
    })
    assert dup_res.status_code == 400

    # 3. Successful login
    login_res = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "securepassword123",
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["email"] == "test@example.com"
    assert "token" in login_data

    # 4. Failed login with wrong password
    bad_login = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert bad_login.status_code == 401


def test_expense_crud_and_cross_user_isolation(client):
    """Test expense creation, listing, updating, deleting and multi-user data isolation."""
    # Create User A
    user_a = client.post("/auth/signup", json={
        "name": "User Alpha",
        "email": "alpha@example.com",
        "password": "password123",
    }).json()
    token_a = user_a["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Create User B
    user_b = client.post("/auth/signup", json={
        "name": "User Beta",
        "email": "beta@example.com",
        "password": "password123",
    }).json()
    token_b = user_b["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates an expense
    create_res = client.post("/expenses", headers=headers_a, json={
        "merchant": "Swiggy",
        "amount": 420.50,
        "date": "2026-10-09",
        "category": "Food",
        "payment": "UPI",
        "confidence": 95.0,
        "notes": "Team dinner",
    })
    assert create_res.status_code == 200
    expense_data = create_res.json()
    expense_id = expense_data["id"]
    assert expense_data["merchant"] == "Swiggy"
    assert expense_data["amount"] == 420.50

    # User A lists expenses -> should see 1 expense
    list_a = client.get("/expenses", headers=headers_a)
    assert list_a.status_code == 200
    assert len(list_a.json()) == 1
    assert list_a.json()[0]["id"] == expense_id

    # User B lists expenses -> MUST BE EMPTY (Strict isolation)
    list_b = client.get("/expenses", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # User B attempts to edit User A's expense -> MUST RETURN 404 NOT FOUND
    forbidden_edit = client.put(f"/expenses/{expense_id}", headers=headers_b, json={
        "merchant": "Hacked Merchant",
    })
    assert forbidden_edit.status_code == 404

    # User B attempts to delete User A's expense -> MUST RETURN 404 NOT FOUND
    forbidden_delete = client.delete(f"/expenses/{expense_id}", headers=headers_b)
    assert forbidden_delete.status_code == 404

    # User A successfully updates their expense
    update_res = client.put(f"/expenses/{expense_id}", headers=headers_a, json={
        "amount": 500.00,
        "notes": "Updated dinner note",
    })
    assert update_res.status_code == 200
    assert update_res.json()["amount"] == 500.00

    # User A deletes their expense
    delete_res = client.delete(f"/expenses/{expense_id}", headers=headers_a)
    assert delete_res.status_code == 200

    # User A lists expenses again -> should now be empty
    list_a_empty = client.get("/expenses", headers=headers_a)
    assert len(list_a_empty.json()) == 0
