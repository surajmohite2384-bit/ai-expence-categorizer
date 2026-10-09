# SpendAI Expense Categorizer

SpendAI is a React/Vite expense dashboard backed by a FastAPI API and MySQL database. Users can create an account, sign in, and manage expenses associated with their authenticated account.

## Requirements

* Node.js and npm
* Python 3.10 or newer
* MySQL 8 or a compatible MySQL server

## MySQL Setup

Create the database using MySQL Workbench or your MySQL client:

```sql
CREATE DATABASE ai_expense_categorizer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Configure your database credentials securely using environment variables. Do not commit database passwords or API keys to GitHub.

## Backend Setup

Open a terminal in the project root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Configure your backend environment variables in `backend/.env`. These may include your database connection details, `GEMINI_API_KEY`, and application settings.

Keep `.env` files private.

Start the FastAPI development server from the backend directory:

```powershell
uvicorn app.main:app --reload
```

The API documentation is available at:

`http://127.0.0.1:8000/docs`

## Frontend Setup

Open another terminal in the project root:

```powershell
npm install
npm run dev
```

Open the local URL displayed by Vite in the terminal.

Configure the frontend API URL to match your backend deployment when deploying the application.

## Build

To build the frontend for production:

```powershell
npm run build
```

The production build is generated in the `dist` directory.

## Deployment

* Frontend: Render Static Site
* Backend: Render Web Service
* Database: Railway MySQL

Set production environment variables through your hosting provider's dashboard. Use a strong, private JWT signing secret, secure database credentials, and the correct CORS origins.

Never publish passwords, API keys, signing secrets, or real user data in this repository.
