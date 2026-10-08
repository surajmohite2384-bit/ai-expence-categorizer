# SpendAI Expense Categorizer

SpendAI is a React/Vite expense dashboard backed by a FastAPI API and MySQL database. Users can create an account, sign in, and manage expenses associated with their authenticated account.

## Requirements

- Node.js and npm
- Python 3.10 or newer
- MySQL 8 or a compatible MySQL server

## MySQL setup

Create the database and application user in MySQL. Run these statements using a MySQL administrator account, replacing the password with a private value:

```sql
CREATE DATABASE ai_expense_categorizer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'spendai'@'localhost' IDENTIFIED BY 'replace-with-a-private-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
  ON ai_expense_categorizer.* TO 'spendai'@'localhost';
FLUSH PRIVILEGES;
```

If the API runs on a different host than MySQL, use the appropriate MySQL host pattern instead of `localhost` and configure the server firewall to allow only the API host.

## Backend setup

From the repository root, create and activate a Python environment, then install the backend dependencies:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` with your MySQL connection details:

```dotenv
DB_USER=spendai
DB_PASSWORD=replace-with-a-private-password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ai_expense_categorizer
APP_ENV=development
GEMINI_API_KEY=your-gemini-api-key
```

Keep this file private; `.env` files are excluded from Git. The backend accepts an optional `DATABASE_URL`, but it must use the `mysql+pymysql://` driver and include the database name. The database must exist before the API starts; the application creates its tables on startup, but does not create or silently switch the database.

Expense categorization is requested from FastAPI at `/predictCategory`. The backend tries Gemini using `GEMINI_API_KEY` and falls back to the rule-based categorizer if Gemini is unavailable or returns invalid data. The response includes the category, confidence score, and source (`gemini` or `heuristic`); the key is never sent to the React application. Confidence scores are not measured classification accuracy.

Set a private signing secret before starting the API. For local PowerShell development:

```powershell
$env:JWT_SECRET = py -c "import secrets; print(secrets.token_urlsafe(32))"
uvicorn app.main:app --reload
```

The API listens on `http://127.0.0.1:8000`. On startup it connects to the configured MySQL database, creates application tables, migrates legacy plaintext password records to salted hashes, and seeds demo accounts in development mode. Demo sign-in: `alex.kumar@spendai.io` / `password123`. Production mode rejects the reserved development demo-account addresses; existing demo rows are not deleted.

For production, set `APP_ENV=production`, provide a stable, high-entropy `JWT_SECRET`, configure the production MySQL database and comma-separated `CORS_ALLOWED_ORIGINS`, and do not use the demo credentials. Demo accounts are not seeded and the frontend demo autofill is disabled when built for production. If `JWT_SECRET` is omitted in development, a random temporary secret is generated and existing sessions will stop working when the API restarts.

## Frontend setup

In a separate terminal from the repository root:

```powershell
npm install
npm run dev
```

The Vite development server proxies `/api` to `http://127.0.0.1:8000`. Set `VITE_API_BASE_URL` at build time only if your API is served from a different URL.

Create-account and sign-in requests require the API to be available. FastAPI sets an HttpOnly `spendai_token` cookie, and the browser sends it automatically for authenticated expense requests. In production the cookie is Secure and SameSite=Lax.

## Build

```powershell
npm run build
```
