import os
import logging
from datetime import date as Date, datetime, timedelta
from decimal import Decimal
import hashlib
import secrets
from urllib.parse import urlsplit

import jwt
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.ai import GeminiCategorizationError, categorize_expense
from app.database import Base, SessionLocal, engine
from app.models import Category, Expense, User

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET")
APP_ENV = os.getenv("APP_ENV", "development").lower()
if APP_ENV == "production":
    if not JWT_SECRET or len(JWT_SECRET) < 32 or JWT_SECRET.lower().startswith(
        ("replace-", "change-me", "your-")
    ):
        raise RuntimeError(
            "Production requires a real JWT_SECRET with at least 32 characters; "
            "generate one with Python's secrets.token_urlsafe(64)."
        )
elif not JWT_SECRET:
    JWT_SECRET = secrets.token_urlsafe(32)
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

AUTH_COOKIE_NAME = "spendai_token"
AUTH_COOKIE_SECURE = APP_ENV == "production"

app = FastAPI(
    title="AI Expense Categorizer API",
    description="Backend API for AI Expense Categorizer",
    version="1.0.0",
)

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
if APP_ENV == "production" and (
    not CORS_ALLOWED_ORIGINS
    or any(
        urlsplit(origin).scheme != "https"
        or not urlsplit(origin).netloc
        or origin == "*"
        for origin in CORS_ALLOWED_ORIGINS
    )
):
    raise RuntimeError(
        "Production CORS_ALLOWED_ORIGINS must contain only HTTPS website origins."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a unique cryptographic salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}:{key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against the stored salt:hash string."""
    if not stored_hash or ":" not in stored_hash:
        return False
    try:
        salt, key_hex = stored_hash.split(":", 1)
        new_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return secrets.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False


def migrate_legacy_passwords(db: Session) -> int:
    """Replace legacy plaintext password records with salted hashes."""
    legacy_users = (
        db.query(User)
        .filter(User.password_hash != "", ~User.password_hash.like("%:%"))
        .all()
    )
    for user in legacy_users:
        user.password_hash = hash_password(user.password_hash)
    if legacy_users:
        logger.warning(
            "Migrated %d legacy plaintext password record(s) to salted hashes.",
            len(legacy_users),
        )
    return len(legacy_users)


DEVELOPMENT_DEMO_EMAILS = frozenset(
    {"alex.kumar@spendai.io", "demo@spendai.local"}
)


class UserSignup(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ExpensePredictionRequest(BaseModel):
    merchant: str = Field(min_length=1, max_length=150)
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    description: str = Field(default="", max_length=1000)
    payment_method: str = Field(default="", max_length=50)

    @field_validator("merchant")
    @classmethod
    def reject_blank_merchant(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class ExpenseCreate(BaseModel):
    merchant: str = Field(min_length=1, max_length=150)
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    date: Date
    category: str = Field(min_length=1, max_length=100)
    payment: str = Field(default="UPI", min_length=1, max_length=50)
    confidence: Decimal = Field(
        default=Decimal("0"), ge=0, le=100, max_digits=5, decimal_places=2
    )
    notes: str | None = None

    @field_validator("merchant", "category", "payment")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class ExpenseUpdate(BaseModel):
    merchant: str | None = Field(default=None, min_length=1, max_length=150)
    amount: Decimal | None = Field(
        default=None, gt=0, max_digits=10, decimal_places=2
    )
    date: Date | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    payment: str | None = Field(default=None, min_length=1, max_length=50)
    confidence: Decimal | None = Field(
        default=None, ge=0, le=100, max_digits=5, decimal_places=2
    )
    notes: str | None = None

    @field_validator("merchant", "category", "payment")
    @classmethod
    def reject_blank_text(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("must not be blank")
        return value


def get_category_name(db: Session, category_id: int | None) -> str:
    if category_id is None:
        return "Other"
    category = db.query(Category).filter(Category.id == category_id).first()
    return category.name if category else "Other"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(user: User) -> str:
    expires_at = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.email,
        "exp": expires_at,
        "name": user.name,
        "role": "Personal Account",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def authenticated_user_response(
    user: User,
    message: str,
    response: Response,
) -> dict[str, str | int]:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=create_access_token(user),
        max_age=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": "Personal Account",
        "message": message,
    }


def get_current_user_from_token(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.email == email.lower()).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@app.on_event("startup")
def startup_event():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as error:
        logger.exception("Could not connect to or initialize the configured MySQL database.")
        raise RuntimeError(
            "MySQL initialization failed. Verify that MySQL is running, the configured "
            "database exists, and the database user has the required privileges."
        ) from error

    default_categories = [
        "Food",
        "Groceries",
        "Shopping",
        "Transportation",
        "Entertainment",
        "Bills & Utilities",
        "Healthcare",
        "Education",
        "Travel",
        "Other",
    ]

    with SessionLocal() as db:
        migrate_legacy_passwords(db)

        if APP_ENV != "production":
            demo_user = db.query(User).filter(User.email == "alex.kumar@spendai.io").first()
            if not demo_user:
                db.add(
                    User(
                        name="Alex Kumar",
                        email="alex.kumar@spendai.io",
                        password_hash=hash_password("password123"),
                    )
                )
            elif not demo_user.password_hash:
                demo_user.password_hash = hash_password("password123")

            local_demo = db.query(User).filter(User.email == "demo@spendai.local").first()
            if not local_demo:
                db.add(
                    User(
                        name="Demo User",
                        email="demo@spendai.local",
                        password_hash=hash_password("demo-password"),
                    )
                )
            elif not local_demo.password_hash:
                local_demo.password_hash = hash_password("demo-password")

        for category_name in default_categories:
            existing = db.query(Category).filter(Category.name == category_name).first()
            if not existing:
                db.add(Category(name=category_name, description=f"System category: {category_name}"))
        db.commit()


@app.get("/")
def home():
    return {
        "message": "AI Expense Categorizer Backend is running!"
    }


@app.post("/predictCategory")
def predict_category(payload: ExpensePredictionRequest):
    try:
        prediction = categorize_expense(
            merchant=payload.merchant,
            amount=float(payload.amount),
            description=payload.description,
            payment_method=payload.payment_method,
        )
    except Exception as error:
        logger.warning("predict_category error fallback: %s", error)
        prediction = {
            "category": "Other",
            "confidence": 50.0,
            "reason": "Default category fallback",
            "source": "heuristic",
        }
    return {"success": True, **prediction}


@app.get("/test-db")
def test_database():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "success",
            "message": "Database connected successfully!",
        }

    except SQLAlchemyError as error:
        logger.exception("MySQL health check failed.")
        raise HTTPException(
            status_code=503,
            detail="MySQL database is unavailable.",
        ) from error


@app.post("/auth/signup")
@app.post("/auth/register")
def signup(
    payload: UserSignup,
    response: Response,
    db: Session = Depends(get_db),
):
    clean_name = payload.name.strip()
    clean_email = payload.email.strip().lower()
    clean_password = payload.password.strip()

    if not clean_name:
        raise HTTPException(status_code=400, detail="Full name is required")
    if not clean_email or "@" not in clean_email or len(clean_email) > 150:
        raise HTTPException(status_code=400, detail="A valid email address is required")
    if len(clean_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        # If user already exists with an active password hash
        if existing_user.password_hash:
            raise HTTPException(
                status_code=400,
                detail="An account with this email already exists. Please sign in instead.",
            )
        # If user was created before auth was introduced (empty password_hash)
        existing_user.name = clean_name[:100]
        existing_user.password_hash = hash_password(clean_password)
        db.commit()
        db.refresh(existing_user)
        return authenticated_user_response(
            existing_user,
            "Account registered successfully!",
            response,
        )

    new_user = User(
        name=clean_name[:100],
        email=clean_email,
        password_hash=hash_password(clean_password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return authenticated_user_response(new_user, "Account created successfully!", response)


@app.post("/auth/login")
def login(
    payload: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    clean_email = payload.email.strip().lower()
    clean_password = payload.password.strip()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="A valid email address is required")
    if not clean_password:
        raise HTTPException(status_code=400, detail="Password is required")
    if APP_ENV == "production" and clean_email in DEVELOPMENT_DEMO_EMAILS:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.password_hash or not verify_password(clean_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return authenticated_user_response(user, "Login successful", response)


@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return {"message": "Logout successful"}


@app.get("/auth/me")
def get_current_user(
    current_user: User = Depends(get_current_user_from_token),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": "Personal Account",
    }


@app.get("/expenses")
def list_expenses(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == current_user.id)
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
        .all()
    )
    categories_map = {cat.id: cat.name for cat in db.query(Category).all()}
    return [
        {
            "id": expense.id,
            "merchant": expense.merchant,
            "amount": float(expense.amount),
            "date": expense.expense_date.isoformat(),
            "category": categories_map.get(expense.category_id, "Other"),
            "payment": expense.payment_method or "UPI",
            "confidence": float(expense.ai_confidence or 0),
            "notes": None,
        }
        for expense in expenses
    ]


@app.post("/expenses")
def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    category_name = payload.category
    confidence_val = payload.confidence
    reason_str = ""

    # If category is "Other" or unspecified, attempt smart categorization
    if not category_name or category_name == "Other" or confidence_val <= 0:
        try:
            prediction = categorize_expense(
                merchant=payload.merchant,
                amount=float(payload.amount),
                description=payload.notes or "",
                payment_method=payload.payment,
            )
            category_name = prediction.get("category", payload.category or "Other")
            confidence_val = Decimal(str(prediction.get("confidence", 85.0)))
            reason_str = prediction.get("reason", "")
        except Exception as error:
            logger.warning("Categorization fallback in create_expense: %s", error)
            category_name = payload.category or "Other"
            confidence_val = payload.confidence

    # Ensure category exists in DB
    category = (
        db.query(Category)
        .filter(Category.name == category_name)
        .first()
    )
    if not category:
        category = Category(
            name=category_name,
            description=f"Category: {category_name}",
        )
        db.add(category)
        db.flush()

    expense = Expense(
        user_id=current_user.id,
        merchant=payload.merchant,
        amount=payload.amount,
        expense_date=payload.date,
        category_id=category.id,
        payment_method=payload.payment,
        ai_confidence=confidence_val,
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
        "reason": reason_str,
        "notes": payload.notes,
    }


@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if payload.merchant is not None:
        expense.merchant = payload.merchant
    if payload.amount is not None:
        expense.amount = payload.amount
    if payload.date is not None:
        expense.expense_date = payload.date
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
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}