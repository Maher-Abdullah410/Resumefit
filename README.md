# ResumeFit: AI Resume Tailorer & Real-Time ATS Simulator

A web application that tailors a resume to a job description with AI and simulates ATS screening.
Final year project, Dept. of Software Engineering Technology, Punjab Tianjin University of Technology.

**Status (Week 6):** authentication and the first end-to-end ATS analysis slice are implemented, including Gemini-powered resume improvement suggestions.
Resume matching uses a deterministic skills and keyword coverage engine. AI rewriting and export are planned follow-up features.

## Tech stack
React + Tailwind CSS (frontend) | FastAPI + SQLAlchemy + Alembic (backend) | PostgreSQL | bcrypt + JWT (security)

## Repository layout
```
resumefit/
├── backend/
│   ├── app/
│   │   ├── api/          # routers (v1/auth.py, v1/users.py, v1/analyses.py, v1/health.py)
│   │   ├── core/         # config.py (settings), security.py (bcrypt, JWT), errors.py
│   │   ├── db/           # engine/session and declarative base
│   │   ├── models/       # SQLAlchemy models (User, RefreshToken, ResumeAnalysis)
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
```

## Quick start

### 1. Prerequisites
Git, Python 3.12+, Node.js 20+, and a locally installed PostgreSQL 15+ server. Docker is not required.

### 2. Configure the local database
Make sure the Windows service named `postgresql-x64-16` (or your installed PostgreSQL version) is running. In pgAdmin, create a login role and database, both named `resumefit`, or use an existing local PostgreSQL role/database. Set the role's password when creating it.

Copy `backend/.env.example` to `backend/.env`, then set `DATABASE_URL` using your chosen role password, for example:

```text
DATABASE_URL=postgresql+psycopg://resumefit:YOUR_PASSWORD@localhost:5432/resumefit
```

Replace `YOUR_PASSWORD` with the password you set in PostgreSQL. Set `JWT_SECRET` to a random value of at least 32 characters.

### 3. Backend
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item ..\.env.example .env
```

Edit `backend\.env` as described above, and set `GEMINI_API_KEY` to enable resume improvement suggestions. `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`. Generate a `JWT_SECRET` in PowerShell with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Then run:

```powershell
python scripts\check_db.py
alembic upgrade head
uvicorn app.main:app --reload
```
The API is at http://localhost:8000 and its interactive docs are at http://localhost:8000/docs.

### 4. Frontend
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173, create an account, and use the dashboard to analyze a resume against a job description and receive Gemini-powered suggestions.

### 5. Run the tests
Create a separate empty PostgreSQL database named `resumefit_test` in pgAdmin. Tests delete and recreate tables in this database, so do not point `TEST_DATABASE_URL` at your normal application database.

```powershell
cd backend
$env:TEST_DATABASE_URL = "postgresql+psycopg://resumefit:YOUR_PASSWORD@localhost:5432/resumefit_test"
pytest --cov=app
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

## Resume analysis (Week 6)
| Endpoint | Description |
|---|---|
| `POST /api/v1/analyses` | Validate resume and job description text, calculate an ATS-style match, generate Gemini improvement suggestions, and save the result for the signed-in user |
| `GET /api/v1/analyses` | List the signed-in user's saved analysis results, newest first |

The score combines detected skill coverage (70%) and job-keyword coverage (30%) when both are available. If only one category is detected, that category determines the score. Analysis inputs are stored for the user's history but are not returned by the API. Resume text and job descriptions are sent to Gemini to generate suggestions, so configure `GEMINI_API_KEY` before analyzing. The deterministic score is informational, not an AI-generated rewrite or a hiring decision. The database migration is applied with `alembic upgrade head`.

## Security highlights
- Passwords hashed with **bcrypt (cost 12)**; the plain password is never stored or logged
- **JWT access tokens** expire after 60 minutes; **refresh tokens** (7 days) are opaque, stored only as SHA-256 hashes, rotated on every use, and revoked on reuse
- **Account lockout** after 5 failed logins for 15 minutes; login responses do not reveal whether an email exists
- Refresh cookie is `HttpOnly`, `Secure`, `SameSite=Strict`
- **Multi-tenant isolation:** the user id is taken only from the signed token; every tenant-scoped query must filter by it
- Secrets come from environment variables; the app refuses to start without a strong `JWT_SECRET`

## Contributing
See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
