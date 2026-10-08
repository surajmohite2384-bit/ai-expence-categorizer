import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.ai import categorize_expense

if __name__ == "__main__":
    import json

    result = categorize_expense(
        merchant="Swiggy",
        amount=450,
        description="Ordered dinner",
        payment_method="UPI",
    )
    print("Test AI Categorization:")
    print(json.dumps(result, indent=2))
