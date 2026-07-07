# PennyWise — Expense Tracker

Full-stack expense tracker: React (Vite) frontend, Express backend, SQLite database (Node's built-in `node:sqlite`).

## Structure

- `backend/` — Express REST API (`/api/expenses`), SQLite database file at `backend/db/expenses.db`
- `frontend/` — React app (landing page, navbar, dashboard)

## Run it

Two terminals:

```bash
cd backend
npm install   # first time only
npm run dev   # http://localhost:4000
```

```bash
cd frontend
npm install   # first time only
npm run dev   # http://localhost:5173
```

Open http://localhost:5173. The frontend dev server proxies `/api/*` to the backend, so no CORS setup is needed in dev.

## Features

- Add / edit / delete expenses (title, amount in ₹, category, date, notes)
- Monthly budget: set a budget per month, see remaining balance update live as you spend
- Progress bar with color states (ok / near limit ≥80% / exceeded ≥100%) and alert banners
- Category-wise breakdown chart (horizontal bar, one fixed color per category)
- Month-wise history table — budget, spent, remaining, and status for every month, click a row to jump to it
- Month picker (prev/next arrows or native month picker) drives the whole dashboard

## API

| Method | Path                          | Description                                              |
|--------|-------------------------------|-----------------------------------------------------------|
| GET    | /api/expenses                 | List all expenses                                          |
| GET    | /api/expenses/summary         | Total, count, totals by category, totals by month           |
| GET    | /api/expenses/summary?month=YYYY-MM | Adds month-scoped total/count/category breakdown       |
| GET    | /api/expenses/categories      | Allowed category list                                       |
| GET    | /api/expenses/:id             | Get one expense                                              |
| POST   | /api/expenses                 | Create an expense                                             |
| PUT    | /api/expenses/:id             | Update an expense                                              |
| DELETE | /api/expenses/:id             | Delete an expense                                               |
| GET    | /api/budgets                  | List all budgets, keyed by month                                |
| GET    | /api/budgets/:month            | Get the budget for one month (YYYY-MM)                          |
| PUT    | /api/budgets/:month            | Set (create or update) the budget for a month                    |

## Requirements

Node.js 22.5+ (uses the built-in `node:sqlite` module — no native build tools needed).
