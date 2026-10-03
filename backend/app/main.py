from datetime import date

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import Category, Expense, User

app = FastAPI(
    title="AI Expense Categorizer API",
    description="Backend API for AI Expense Categorizer",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExpenseCreate(BaseModel):
    merchant: str
    amount: float
    date: str
    category: str
    payment: str = "UPI"
    confidence: float = 0.0
    notes: str | None = None


class ExpenseUpdate(BaseModel):
    merchant: str | None = None
    amount: float | None = None
    date: str | None = None
    category: str | None = None
    payment: str | None = None
    confidence: float | None = None
    notes: str | None = None


def get_category_name(db: Session, category_id: int | None) -> str:
    if category_id is None:
        return "Other"
    category = db.query(Category).filter(Category.id == category_id).first()
    return category.name if category else "Other"


def get_account_user(db: Session, email: str) -> User:
    normalized_email = email.strip().lower()
    if len(normalized_email) > 150 or "@" not in normalized_email:
        raise HTTPException(status_code=400, detail="A valid account email is required")

    user = db.query(User).filter(User.email == normalized_email).first()
    if user:
        return user

    name = normalized_email.split("@", 1)[0].replace(".", " ").replace("_", " ").title()
    user = User(name=name[:100] or "SpendAI User", email=normalized_email, password_hash="")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

    default_categories = [
        "Food & Dining",
        "Transport",
        "Shopping",
        "Bills & Utilities",
        "Entertainment",
        "Health Care",
        "Other",
    ]

    with SessionLocal() as db:
        from app.models import User

        if not db.query(User).filter(User.email == "demo@spendai.local").first():
            db.add(User(name="Demo User", email="demo@spendai.local", password_hash="demo-password"))

        for category_name in default_categories:
            existing = db.query(Category).filter(Category.name == category_name).first()
            if not existing:
                db.add(Category(name=category_name, description=f"System category: {category_name}"))
        db.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "AI Expense Categorizer Backend is running!"
    }


@app.get("/test-db")
def test_database():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "success",
            "message": "Database connected successfully!",
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }


@app.get("/expenses")
def list_expenses(
    x_user_email: str = Header(..., alias="X-User-Email"),
    db: Session = Depends(get_db),
):
    user = get_account_user(db, x_user_email)
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user.id)
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
        .all()
    )
    return [
        {
            "id": expense.id,
            "merchant": expense.merchant,
            "amount": float(expense.amount),
            "date": expense.expense_date.isoformat(),
            "category": get_category_name(db, expense.category_id),
            "payment": expense.payment_method or "UPI",
            "confidence": float(expense.ai_confidence or 0),
            "notes": None,
        }
        for expense in expenses
    ]


@app.post("/expenses")
def create_expense(
    payload: ExpenseCreate,
    x_user_email: str = Header(..., alias="X-User-Email"),
    db: Session = Depends(get_db),
):
    try:
        parsed_date = date.fromisoformat(payload.date)
    except ValueError:
        raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format")

    category = db.query(Category).filter(Category.name == payload.category).first()
    if not category:
        category = Category(name=payload.category, description="User-created category")
        db.add(category)
        db.flush()

    user = get_account_user(db, x_user_email)

    expense = Expense(
        user_id=user.id,
        merchant=payload.merchant,
        amount=payload.amount,
        expense_date=parsed_date,
        category_id=category.id,
        payment_method=payload.payment,
        ai_confidence=payload.confidence,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    return {
        "id": expense.id,
        "merchant": expense.merchant,
        "amount": float(expense.amount),
        "date": expense.expense_date.isoformat(),
        "category": category.name,
        "payment": expense.payment_method or "UPI",
        "confidence": float(expense.ai_confidence or 0),
        "notes": None,
    }


@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    x_user_email: str = Header(..., alias="X-User-Email"),
    db: Session = Depends(get_db),
):
    user = get_account_user(db, x_user_email)
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if payload.merchant is not None:
        expense.merchant = payload.merchant
    if payload.amount is not None:
        expense.amount = payload.amount
    if payload.date is not None:
        try:
            expense.expense_date = date.fromisoformat(payload.date)
        except ValueError:
            raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format")
    if payload.category is not None:
        category = db.query(Category).filter(Category.name == payload.category).first()
        if not category:
            category = Category(name=payload.category, description="User-created category")
            db.add(category)
            db.flush()
        expense.category_id = category.id
    if payload.payment is not None:
        expense.payment_method = payload.payment
    if payload.confidence is not None:
        expense.ai_confidence = payload.confidence

    db.commit()
    db.refresh(expense)

    category = db.query(Category).filter(Category.id == expense.category_id).first()

    return {
        "id": expense.id,
        "merchant": expense.merchant,
        "amount": float(expense.amount),
        "date": expense.expense_date.isoformat(),
        "category": category.name if category else "Other",
        "payment": expense.payment_method or "UPI",
        "confidence": float(expense.ai_confidence or 0),
        "notes": None,
    }


@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    x_user_email: str = Header(..., alias="X-User-Email"),
    db: Session = Depends(get_db),
):
    user = get_account_user(db, x_user_email)
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}