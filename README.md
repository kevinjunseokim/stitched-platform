# Stitched

Stitched is split into clearly defined frontend and backend apps.

- `frontend/` contains the Vite/React product UI.
- `backend/` contains the Python/Flask API with SQLite persistence.

## Run locally

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the apps in two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

The backend runs on `http://localhost:5001`, and the frontend runs on `http://localhost:5173`. Runtime data is stored in `backend/data/stitched.sqlite`, which is intentionally ignored by git.

## Production deployment

Set these environment variables before starting the backend:

```bash
ENVIRONMENT=production
SECRET_KEY=<strong-random-secret>
DATABASE_URL=<sqlalchemy-database-url>
CORS_ORIGINS=https://your-frontend.example
```

Run database migrations explicitly during deploy:

```bash
cd backend
flask --app wsgi:app db upgrade
```

Start the API with gunicorn:

```bash
cd backend
gunicorn wsgi:app
```

Demo data is development-only and should be seeded manually with `python seed.py` when needed. Production startup does not seed demo users or catalog data automatically.

## Backend API

- `POST /api/register` creates a user with email/password/display name, assigns a unique `@handle`, and returns `{ user, access_token, refresh_token }` when email is auto-confirmed (default in development).
- `POST /api/login` signs in an existing confirmed user and returns `{ user, access_token, refresh_token }`.
- `GET /api/current-user` returns the current authenticated user.
- `POST /api/refresh` refreshes an access token from a refresh token.
- `POST /api/confirm-email` confirms an account from `{ token }` (or `GET /api/confirm-email?token=...`).
- `POST /api/resend-confirmation` re-sends a confirmation link for an unconfirmed email.
- `POST /api/forgot-password` starts a password reset for an email address.
- `POST /api/reset-password` completes a reset with `{ token, password }`.
- `GET /api/stats` returns live platform stats used by the landing/auth UI.
- `GET /api/items` lists persisted items for the authenticated user.
- `POST /api/items` saves an item from the 8-step add-item flow.
- `GET /api/items/:id` returns a persisted item owned by the authenticated user.
