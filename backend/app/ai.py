import json
import logging
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# =========================================================
# LOAD ENVIRONMENT (app/.env, backend/.env, root .env)
# =========================================================
APP_DIR = Path(__file__).resolve().parent
for env_candidate in (
    APP_DIR / ".env",
    APP_DIR.parent / ".env",
    APP_DIR.parent.parent / ".env",
):
    if env_candidate.is_file():
        load_dotenv(env_candidate)

CATEGORIES = {
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
}

HEURISTIC_RULES: list[dict[str, Any]] = [
    {
        "category": "Food",
        "merchants": [
            "swiggy", "zomato", "mcdonald", "mcdonalds", "starbucks", "burger king",
            "kfc", "domino", "dominos", "pizza hut", "subway", "chai point",
            "haldiram", "barbeque nation", "cafe coffee day", "ccd", "eatclub",
            "behrouz", "faasos", "biryani", "bakery", "restaurant", "cafe", "dhaba"
        ],
        "keywords": [
            "food", "lunch", "dinner", "breakfast", "meal", "snack", "coffee",
            "tea", "pizza", "burger", "dessert", "dining", "thali", "sweets"
        ],
    },
    {
        "category": "Groceries",
        "merchants": [
            "blinkit", "zepto", "instamart", "bigbasket", "bb daily", "dmart",
            "reliance fresh", "spencer", "nature basket", "more supermarket",
            "dunzo", "country delight", "milk basket"
        ],
        "keywords": [
            "grocery", "groceries", "supermarket", "mart", "provision", "milk",
            "vegetable", "vegetables", "fruit", "fruits", "dairy", "atta", "ration"
        ],
    },
    {
        "category": "Shopping",
        "merchants": [
            "amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "zudio",
            "zara", "h&m", "uniqlo", "lifestyle", "shoppers stop", "pantaloons",
            "croma", "reliance digital", "vijay sales", "decathlon", "ikea"
        ],
        "keywords": [
            "shopping", "clothing", "clothes", "apparel", "shoes", "footwear",
            "electronics", "gadget", "watch", "perfume", "fashion", "accessories"
        ],
    },
    {
        "category": "Transportation",
        "merchants": [
            "uber", "ola", "rapido", "blusmart", "irctc", "metro", "dmrc", "bmrc",
            "indian oil", "iocl", "hpcl", "bpcl", "shell", "fastag", "redbus",
            "abhibus", "chalo"
        ],
        "keywords": [
            "transport", "transportation", "cab", "taxi", "auto", "rickshaw",
            "metro", "bus", "train", "fuel", "petrol", "diesel", "parking",
            "toll", "fare", "flight", "commute"
        ],
    },
    {
        "category": "Entertainment",
        "merchants": [
            "netflix", "spotify", "bookmyshow", "pvr", "inox", "cinepolis",
            "hotstar", "disney", "prime video", "youtube premium", "sony liv",
            "zee5", "apple music", "steam", "playstation", "xbox", "gaana", "wynk"
        ],
        "keywords": [
            "entertainment", "movie", "cinema", "music", "streaming", "ott",
            "concert", "show", "theatre", "game", "gaming", "subscription", "event"
        ],
    },
    {
        "category": "Bills & Utilities",
        "merchants": [
            "bescom", "tneb", "mseb", "uppcl", "mahavitaran", "adanigas", "igl",
            "indane", "bharat gas", "hp gas", "airtel", "jio", "vi", "vodafone",
            "tata play", "dish tv", "act fibernet", "hathway", "cred"
        ],
        "keywords": [
            "bill", "bills", "utility", "utilities", "electricity", "water",
            "cylinder", "gas", "power", "wifi", "broadband", "mobile bill",
            "recharge", "postpaid", "dth", "maintenance", "piped gas"
        ],
    },
    {
        "category": "Healthcare",
        "merchants": [
            "apollo", "apollo pharmacy", "1mg", "tata 1mg", "pharmeasy", "netmeds",
            "medplus", "practo", "max healthcare", "fortis", "dr lal pathlabs",
            "metropolis", "cult.fit", "cultfit"
        ],
        "keywords": [
            "health", "healthcare", "medicine", "pharmacy", "chemist", "doctor",
            "hospital", "clinic", "lab", "diagnostic", "blood test", "dental",
            "dentist", "fitness", "gym", "workout", "therapy", "tablets"
        ],
    },
    {
        "category": "Education",
        "merchants": [
            "udemy", "coursera", "edx", "unacademy", "byjus", "physics wallah",
            "simplilearn", "upgrad", "crossword", "oxford"
        ],
        "keywords": [
            "education", "course", "tuition", "coaching", "school", "college",
            "university", "fees", "books", "book", "stationery", "exam", "training"
        ],
    },
    {
        "category": "Travel",
        "merchants": [
            "makemytrip", "goibibo", "easemytrip", "yatra", "cleartrip", "airbnb",
            "booking.com", "agoda", "oyo", "taj hotels", "marriott", "indigo",
            "air india", "spicejet", "vistara"
        ],
        "keywords": [
            "travel", "hotel", "resort", "vacation", "trip", "holiday", "tour",
            "homestay", "flight ticket", "boarding"
        ],
    },
]


def heuristic_categorize(
    merchant: str,
    amount: float,
    description: str = "",
) -> dict[str, Any]:
    """Fast, reliable offline heuristic categorizer used as default or fallback."""
    text_to_match = f"{merchant} {description}".lower().strip()
    clean_text = re.sub(r"[^a-z0-9\s]", " ", text_to_match)

    for rule in HEURISTIC_RULES:
        # Check specific merchant names
        for m in rule["merchants"]:
            if m in clean_text:
                return {
                    "category": rule["category"],
                    "confidence": 95.0,
                    "reason": f"Matched trusted merchant pattern '{m.title()}' (Smart rule fallback)",
                    "source": "heuristic",
                }

        # Check keyword semantic tokens
        for kw in rule["keywords"]:
            if re.search(r"\b" + re.escape(kw) + r"\b", clean_text):
                return {
                    "category": rule["category"],
                    "confidence": 88.0,
                    "reason": f"Matched transaction keyword '{kw}' (Smart rule fallback)",
                    "source": "heuristic",
                }

    # General fallback
    return {
        "category": "Other",
        "confidence": 55.0,
        "reason": "Unrecognized merchant pattern — categorized as Other",
        "source": "heuristic",
    }


class GeminiCategorizationError(Exception):
    pass


@lru_cache(maxsize=1)
def _get_client() -> genai.Client | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY is not configured; rule-based fallback will be used.")
        return None
    try:
        return genai.Client(
            api_key=api_key.strip(),
            http_options=types.HttpOptions(timeout=12_000),  # 12-second valid deadline
        )
    except Exception as init_error:
        logger.warning("Could not initialize Gemini Client: %s", init_error)
        return None


def categorize_expense(
    merchant: str,
    amount: float,
    description: str = "",
    payment_method: str = "",
) -> dict[str, Any]:
    """Categorizes an expense using Google Gemini API, with automatic heuristic fallback."""
    # Compute heuristic baseline
    fallback_result = heuristic_categorize(merchant, amount, description)

    client = _get_client()
    if not client:
        logger.info("Using heuristic categorization: %s", fallback_result["category"])
        return fallback_result

    prompt = f"""
Categorize this expense into exactly ONE of these categories:
Food, Groceries, Shopping, Transportation, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Other.

Expense:
Merchant: {merchant}
Amount: ₹{amount}
Description: {description}
Payment method: {payment_method}

Return ONLY valid JSON in this exact format:
{{"category": "Food", "confidence": 95.0, "reason": "Short explanation"}}
Rules:
- category must be one of the listed categories
- confidence must be a number between 0 and 100
- reason must be a short explanation
- return raw JSON only without markdown codeblocks
"""
    try:
        gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        logger.info("Sending expense to Gemini (merchant: %s, model: %s)...", merchant, gemini_model)
        response = client.models.generate_content(
            model=gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )

        if not response.text:
            raise ValueError("Gemini returned an empty response.")

        clean_text = response.text.strip()
        if clean_text.startswith("```"):
            clean_text = re.sub(r"^```(?:json)?\s*|\s*```$", "", clean_text, flags=re.MULTILINE).strip()

        result = json.loads(clean_text)
        category = result.get("category")
        confidence = result.get("confidence")
        reason = result.get("reason", "").strip()

        if category not in CATEGORIES:
            raise ValueError(f"Gemini returned unsupported category: {category}")

        if (
            not isinstance(confidence, (int, float))
            or isinstance(confidence, bool)
            or not 0 <= confidence <= 100
        ):
            raise ValueError("Gemini returned an invalid confidence score.")

        if not reason:
            reason = f"Categorized by Gemini AI as {category}"

        logger.info("Gemini categorized '%s' -> %s (confidence: %s%%)", merchant, category, confidence)
        return {
            "category": category,
            "confidence": float(confidence),
            "reason": reason,
            "source": "gemini",
        }

    except Exception as error:
        logger.warning(
            "Gemini API unavailable or quota exhausted (%s). Seamlessly using smart heuristic fallback.",
            error,
        )
        # Never fail or crash: return high-quality heuristic prediction seamlessly!
        return fallback_result
