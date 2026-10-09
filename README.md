# SpendAI - AI Expense Categorizer

A full-stack, AI-powered personal expense management and analytics system. Users can track expenses, automatically categorize transactions using Google Gemini Generative AI (with an offline heuristic fallback engine), visualize spending patterns with interactive analytics charts, and manage their data securely.

---

## Architecture Overview

```
+-------------------------------------------------------------+
|                     React.js + Vite Frontend                |
|           (Render Static Site / Global CDN Distribution)    |
+-------------------------------------------------------------+
                              |
                     HTTPS / JSON REST API
         (JWT Auth Cookie & Bearer Authorization Header)
                              v
+-------------------------------------------------------------+
|                   FastAPI Backend Web Service               |
|            (Railway / Render Python 3.12 Web Service)       |
+-------------------------------------------------------------+
          |                                       |
    SQLAlchemy ORM                           Google GenAI SDK
          |                                       |
          v                                       v
+-----------------------+              +----------------------+
| Railway MySQL Database|              | Google Gemini AI API |
| (Users, Expenses,     |              | (Categorization &    |
|  Categories, History) |              |  Confidence Engine)  |
+-----------------------+              +----------------------+
```

---

## Key Features

- **Automated AI Categorization**: Real-time transaction categorization powered by Google Gemini AI with confidence scoring and concise reasoning.
- **Smart Fallback Engine**: High-accuracy offline heuristic rule engine ensuring 100% categorizer availability even during AI rate limits or network issues.
- **Strict Data Isolation**: Each authenticated user only has access to their own financial records.
- **Interactive Financial Dashboard**: Dynamic monthly/range filtering, spending breakdowns, category distribution graphs, and summary statistics.
- **Export & Import**: Excel and CSV export capabilities via `exceljs`.
- **Production Hardened**: Dual authentication support (HTTP-Only Secure SameSite cookies + Authorization Bearer header fallback), PBKDF2-HMAC-SHA256 password hashing with cryptographic salts, and parameterized SQLAlchemy queries.

---

## Technologies Used

| Tier | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 7 | Modern reactive single-page interface with high-performance CSS styling |
| **Backend** | FastAPI, Uvicorn | Asynchronous Python REST API with auto-generated OpenAPI documentation |
| **Database** | MySQL 8, SQLAlchemy 2, PyMySQL | Relational data persistence with foreign keys and cascade rules |
| **AI Integration** | Google GenAI SDK (`gemini-3.8-flash`) | Structured JSON categorization via Google Gemini API |
| **Authentication**| PyJWT, PBKDF2-HMAC-SHA256 | Cryptographically salted password hashing and stateless JWT tokens |
| **Deployment** | Railway & Render | Railway for MySQL & FastAPI; Render for Static Frontend |

---

## Folder Structure

```
ai-expence-categorizer/
├── .env.example              # Frontend environment variable template
├── .gitignore                # Production git ignore rules
├── index.html                # Vite HTML entry point
├── package.json              # Node.js dependencies and build scripts
├── render.yaml               # Render Blueprint automated deployment config
├── vite.config.js            # Vite build and proxy configuration
├── public/                   # Static favicon and icon assets
├── src/
│   ├── main.jsx              # React DOM mounting entry point
│   ├── App.jsx               # Core dashboard, metrics, filter, & expense UI
│   ├── App.css               # Dashboard and analytics styles
│   ├── Login.jsx             # Authentication UI (Sign in, Sign up, Demo fill)
│   ├── Login.css             # Login form animations and styles
│   └── aiCategorizer.js      # Frontend API client for AI prediction & caching
├── backend/
│   ├── Procfile              # Web process command for Railway & Render
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Backend environment variable template
│   ├── app/
│   │   ├── __init__.py       # Package marker
│   │   ├── main.py           # FastAPI application entry point and routes
│   │   ├── database.py       # SQLAlchemy engine and connection management
│   │   ├── models.py         # SQLAlchemy database models
│   │   └── ai.py             # Google Gemini AI client & heuristic engine
│   └── tests/
│       ├── test_api.py       # Automated integration & regression test suite
│       └── test_ai_categorizer.py # Standalone AI categorization test
```

---

## Prerequisites

- **Node.js**: v18+ or v20+
- **Python**: 3.10+ (tested on Python 3.12)
- **MySQL**: 8.0+ (local instance or remote Railway MySQL)
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

---

## Local Setup Guide

### 1. MySQL Database Setup

Ensure MySQL is running locally, then create the database:

```sql
CREATE DATABASE ai_expense_categorizer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

1. Navigate to the `backend` directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   ```
2. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   Configure your database credentials and `GEMINI_API_KEY` in `backend/.env`.
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup

1. Open a new terminal in the project root:
   ```bash
   npm install
   ```
2. Copy the frontend environment template (optional for local dev):
   ```bash
   cp .env.example .env
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the displayed local Vite URL (typically `http://localhost:5173`).

---

## Testing Commands

### Backend Automated Test Suite
Run the test suite verifying health endpoints, authentication, AI fallbacks, and data isolation:

```bash
cd backend
.\.venv\Scripts\pytest tests/test_api.py -v
```

### Frontend Production Build Test
Verify that the frontend builds without TypeScript/bundling issues:

```bash
npm run build
```

---

## Cloud Deployment (Railway & Render)

### Architecture
- **Railway**: Hosts the **MySQL Database** and the **FastAPI Backend**
- **Render**: Hosts the **React Frontend** as a **Static Site**

### Step 1: Railway MySQL Database
1. Create a new project on [Railway](https://railway.com) $\rightarrow$ **Provision MySQL**.
2. Go to the MySQL service $\rightarrow$ **Variables** tab $\rightarrow$ copy `DATABASE_URL`.

### Step 2: Railway FastAPI Backend Service
1. In the same Railway project, click **+ New** $\rightarrow$ **GitHub Repo** $\rightarrow$ select `ai-expence-categorizer`.
2. In **Settings**:
   - **Root Directory**: `/backend`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. In **Variables**, add:
   - `DATABASE_URL`: Reference `${{MySQL.DATABASE_URL}}` (or paste connection string)
   - `APP_ENV`: `production`
   - `JWT_SECRET`: Random 64-character secret
   - `GEMINI_API_KEY`: Your Gemini API key
   - `AUTH_COOKIE_SAMESITE`: `none`
   - `CORS_ALLOWED_ORIGINS`: Your frontend Render domain (e.g. `https://spendai.onrender.com`)
4. In **Networking** $\rightarrow$ click **Generate Domain** $\rightarrow$ copy your backend URL.

### Step 3: Render Frontend Static Site
1. On [Render](https://render.com), click **New +** $\rightarrow$ **Static Site** $\rightarrow$ select your repository.
2. Configuration:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `backend/dist`
3. In **Environment Variables**:
   - `VITE_API_BASE_URL`: Your Railway backend domain (e.g. `https://spendai-backend.up.railway.app`)
4. In **Redirects / Rewrites**:
   - Add rule: `/*` $\rightarrow$ `/index.html` (Rewrite)
5. Click **Create Static Site**.

---

## Troubleshooting Guide

- **Database Connection Refused**:
  Ensure MySQL is running, verify host/port settings, and check that the user has `CREATE TABLE`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` privileges.
- **Cross-Domain Session Expired (401)**:
  Ensure `AUTH_COOKIE_SAMESITE=none` is set on the backend and both frontend/backend use HTTPS.
- **CORS Blocked**:
  Confirm the frontend URL in `CORS_ALLOWED_ORIGINS` does NOT have a trailing slash (e.g., use `https://app.onrender.com`, not `https://app.onrender.com/`).
- **Gemini Quota Exceeded**:
  The system automatically falls back to the deterministic heuristic categorization engine without throwing an error to the end user.
