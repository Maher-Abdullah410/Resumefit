# ResumeFit: AI Resume Tailorer & Real-Time ATS Simulator

A web application that tailors a resume to a job description with AI and simulates ATS screening.
Final year project, Dept. of Software Engineering Technology, Punjab Tianjin University of Technology.

**Status (Week 5):** project scaffolding and the core authentication layer are done.
Resume analysis, AI rewriting, history, and export arrive in later weeks.

## Tech stack
React + Tailwind CSS (frontend) | FastAPI + SQLAlchemy + Alembic (backend) | PostgreSQL | bcrypt + JWT (security)

## Repository layout
```
resumefit/
├── backend/
│   ├── app/
│   │   ├── api/          # routers (v1/auth.py, v1/users.py, v1/health.py) and dependencies
│   │   ├── core/         # config.py (settings), security.py (bcrypt, JWT), errors.py
│   │   ├── db/           # engine/session and declarative base
│   │   ├── models/       # SQLAlchemy models (User, RefreshToken)
│   │   ├── schemas/      # Pydantic request/response models
│   │   └── main.py       # FastAPI app factory
│   ├── alembic/          # database migrations
│   ├── scripts/check_db.py   # verifies the database connection
│   └── tests/            # pytest suite (runs against a real PostgreSQL)
├── frontend/             # Vite + React + Tailwind (login, signup, protected dashboard)
├── docs/CONTRIBUTING.md  # branching model and rules
├── scripts/protect-branches.sh   # applies GitHub branch protection
├── .github/              # CI workflow, CODEOWNERS, pull request template
├── .githooks/pre-push    # blocks direct pushes to main/develop
└── docker-compose.yml    # local PostgreSQL
```

## Quick start

### 1. Prerequisites
Git, Python 3.12+, Node.js 20+, and either Docker Desktop or a local PostgreSQL 15+.

### 2. Start the database
```bash
docker compose up -d db
```

### 3. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp ../.env.example .env            # Windows: copy ..\.env.example .env
# open .env and set JWT_SECRET (generate one: python -c "import secrets; print(secrets.token_urlsafe(48))")
python scripts/check_db.py         # should print [OK] lines
alembic upgrade head               # creates the tables
uvicorn app.main:app --reload      # API on http://localhost:8000  (docs at /docs)
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

### 5. Run the tests
```bash
cd backend
pytest --cov=app                   # no database setup needed: tests start their own temporary PostgreSQL
```

## Implemented API (Week 5)
| ID | Endpoint | Description |
|---|---|---|
| A1 | `POST /api/v1/auth/register` | Sign up (bcrypt-hashed password, privacy consent required) |
| A2 | `POST /api/v1/auth/login` | Log in; returns a JWT access token and sets an HttpOnly refresh cookie |
| A3 | `POST /api/v1/auth/refresh` | Rotate the refresh token and get a new access token |
| A4 | `POST /api/v1/auth/logout` | Revoke the refresh token |
| U1 | `GET /api/v1/users/me` | Current user (requires Bearer token) |
| - | `GET /health` | Service and database status |

## Security highlights
- Passwords hashed with **bcrypt (cost 12)**; the plain password is never stored or logged
- **JWT access tokens** expire after 60 minutes; **refresh tokens** (7 days) are opaque, stored only as SHA-256 hashes, rotated on every use, and revoked on reuse
- **Account lockout** after 5 failed logins for 15 minutes; login responses do not reveal whether an email exists
- Refresh cookie is `HttpOnly`, `Secure`, `SameSite=Strict`
- **Multi-tenant isolation:** the user id is taken only from the signed token; every tenant-scoped query must filter by it
- Secrets come from environment variables; the app refuses to start without a strong `JWT_SECRET`

## Contributing
See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
