# ResumeFit: AI Resume Tailorer & Real-Time ATS Simulator

A web application that tailors a resume to a job description with AI and simulates ATS screening.
Final year project, Dept. of Software Engineering Technology, Punjab Tianjin University of Technology.

**Status:** authentication and an end-to-end resume analysis workflow are implemented, including PDF text extraction, ATS-style matching, Gemini-powered bullet rewrites and cover letters, and print-to-PDF export.
Resume matching uses a deterministic skills and keyword coverage engine; scores are estimates, not hiring decisions.

## Tech stack
React + Tailwind CSS (frontend) | FastAPI + SQLAlchemy + Alembic + pypdf (backend) | PostgreSQL | bcrypt + JWT (security)

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
Open http://localhost:5173, create an account, and use the dashboard to upload a PDF or paste a resume, analyze it against a job description, review Gemini-powered rewrites, and export a tailored copy.

Keep the backend running in a separate terminal while using the frontend. The Vite proxy forwards API requests to `http://127.0.0.1:8000`; set `RESUMEFIT_API_TARGET` if your backend uses a different address. A proxy `ECONNREFUSED` means the backend is not reachable; start it from `backend/` with `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`.

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
| `POST /api/v1/analyses/extract` | Extract selectable text from an authenticated PDF upload (5 MB, 50-page limit) |
| `GET /api/v1/analyses/{id}` | Retrieve a saved analysis and its resume/job text for its owner |
| `DELETE /api/v1/analyses/{id}` | Delete one of the signed-in user's saved analyses |
| `POST /api/v1/analyses/{id}/rewrite` | Generate an AI rewrite for a selected resume bullet |
| `POST /api/v1/analyses/{id}/cover-letter` | Generate an AI cover-letter draft from the saved resume and job |

The score combines detected skill coverage (70%) and job-keyword coverage (30%) when both are available. If only one category is detected, that category determines the score; user-added keywords are included in keyword coverage. Analysis inputs are stored for the user's history and returned only from the owner-scoped detail endpoint. Resume text and job descriptions are sent to Gemini for suggestions, rewrites, and cover letters, so configure `GEMINI_API_KEY` before using those features. If Gemini is unavailable, the ATS score is still saved and the result includes an explicit suggestions error. PDF extraction is performed with pypdf; uploaded files are not retained. Apply database changes with `alembic upgrade head`.

## Security highlights
- Passwords hashed with **bcrypt (cost 12)**; the plain password is never stored or logged
- **JWT access tokens** expire after 60 minutes; **refresh tokens** (7 days) are opaque, stored only as SHA-256 hashes, rotated on every use, and revoked on reuse
- **Account lockout** after 5 failed logins for 15 minutes; login responses do not reveal whether an email exists
- Refresh cookie is `HttpOnly`, `Secure`, `SameSite=Strict`
- **Multi-tenant isolation:** the user id is taken only from the signed token; every tenant-scoped query must filter by it
- Secrets come from environment variables; the app refuses to start without a strong `JWT_SECRET`

## Contributing
See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
