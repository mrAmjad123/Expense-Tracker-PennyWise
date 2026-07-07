# PennyWise

PennyWise is a clean, no-fuss expense tracker that helps you see exactly where your money goes. Log expenses in seconds, set monthly budgets, and get instant visual breakdowns of your spending — all in a fast, focused interface with no clutter.

## Features

- **Expense tracking** — add, edit, and delete expenses with title, amount, category, date, and notes
- **Monthly budgets** — set a budget per month and track spending against it
- **Category breakdown** — interactive charts (via Recharts) show spending by category
- **Monthly history** — browse past months and compare spending over time
- **Category filtering** — quickly filter the expense list by category
- **Responsive dashboard** — summary cards, budget overview, and monthly breakdown at a glance

## Tech Stack

- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/) for dev/build tooling
- [React Router](https://reactrouter.com/) for routing
- [Recharts](https://recharts.org/) for data visualization
- [Oxlint](https://oxc.rs/) for linting

## Getting Started

```bash
npm install
npm run dev
```

This is the frontend only — it expects a backend API at `/api/expenses` and `/api/budgets` (see `src/api/`) for expense and budget data.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build
- `npm run lint` — run Oxlint
