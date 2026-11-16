# ResumeFit — Week 6 Progress Report
# Name Maher Abdullah
**Project:** ResumeFit — AI Resume Tailor and Real-Time ATS Simulator
**Reporting week:** Week 6 — Core Business Logic and Vertical Slice
**Report date:** November 16, 2026
**Status:** Completed

## 1. Executive summary

Week 6 delivers ResumeFit's first complete resume-analysis workflow. An authenticated user can enter resume text and a job description in the dashboard, submit both to the FastAPI backend, receive an ATS-style match estimate with matched and missing terms, and revisit saved results from PostgreSQL.

The analysis engine is a deterministic heuristic, not a generative AI model. The implementation establishes the core scoring, validation, persistence, API, and user-interface path that later AI rewriting and export features can build on.

## 2. Week 6 objectives

- Implement the primary resume-to-job match calculation.
- Validate analysis input on the server and return consistent API errors.
- Persist analysis results and provide authenticated, user-specific history.
- Connect the dashboard, API, and PostgreSQL in one working vertical slice.
- Verify the implementation with automated tests and local application checks.

## 3. Work completed

### ATS analysis engine

The backend normalizes text case-insensitively, detects skills from a maintained vocabulary, and ranks relevant job-description keywords after excluding common stop words. It compares the resume against the detected job requirements and returns matched and missing skills and keywords.

When both skill and keyword coverage can be calculated, the score is:

**ATS estimate = round((skill coverage × 0.70 + keyword coverage × 0.30) × 100)**

If only one category has measurable terms, that category supplies the score. If neither category has terms, the score is zero. The same inputs produce the same result.

This estimate is intended as feedback, not as a real applicant-tracking-system result, a hiring decision, or an AI-written resume.

### Server-side validation and errors

The analysis request requires:

- Resume text between 100 and 30,000 characters.
- Job-description text between 50 and 20,000 characters.
- Non-blank values for both fields.
- A valid access token for analysis and history endpoints.

Invalid payloads use the existing structured `VALIDATION_ERROR` response. Unauthenticated requests use the established authentication error response. The frontend displays API errors and disables repeated submissions while an analysis is running.

### Database persistence and account isolation

A new `resume_analyses` table stores each user's resume text, job description, calculated score, match lists, and creation time. The table is introduced by Alembic migration `0002_resume_analyses`.

Analysis creation assigns the owner from the authenticated user, not from client-supplied identity. History queries filter by that authenticated user and sort newest first. API responses include the result and timestamp but do not return the stored resume or job-description text.

### API and frontend vertical slice

| Method and endpoint | Purpose |
|---|---|
| `POST /api/v1/analyses` | Validate input, calculate a score, persist the analysis, and return its result. |
| `GET /api/v1/analyses` | Return the authenticated user's saved analyses, newest first. |

The React dashboard includes resume and job-description fields, character limits, a submit/loading state, an error message, score and match results, and selectable recent history. The frontend uses the existing authenticated API client and refresh-token session flow.

## 4. Verification results

| Check | Result |
|---|---|
| Backend automated tests against local PostgreSQL | **31 passed** |
| Backend total test coverage | **94.95%** (threshold: 70%) |
| Alembic model-versus-migration check | **Passed** — no new upgrade operations detected |
| Database migration | **Passed** — database at revision `0002` |
| Frontend production build | **Passed** |
| Live API health check | **Passed** — API reports database `up` |
| Git whitespace check (`git diff --check`) | **Passed** |

The backend tests covered authentication, validation, score results, database persistence, and analysis-history tenant isolation. The test suite uses a dedicated PostgreSQL database configured through `TEST_DATABASE_URL`.

## 5. Running the project locally

The development environment uses the installed local PostgreSQL service; Docker is not required.

1. Start the local PostgreSQL Windows service and make sure the application database exists.
2. Configure `backend/.env` with the local `DATABASE_URL`, a `JWT_SECRET` of at least 32 characters, and `COOKIE_SECURE=false` for local HTTP development.
3. From `backend`, activate the Python 3.12 virtual environment, apply migrations with `python -m alembic upgrade head`, then start the API with `python -m uvicorn app.main:app --reload`.
4. In a separate terminal, from `frontend`, run `npm run dev` and open `http://localhost:5173`.
5. To run automated tests, set `TEST_DATABASE_URL` to a separate, disposable PostgreSQL test database before running `python -m pytest --cov=app --cov-fail-under=70`. Tests drop and recreate their tables; never point this variable at the application database.

## 6. Scope and next steps

Week 6 accepts pasted text. PDF/DOCX upload and extraction, AI-generated tailoring, export, and advanced ATS behavior are not part of this slice. The deterministic skill vocabulary and keyword heuristic are an initial baseline and can be expanded and calibrated in later iterations.

Because resume text can contain personal information, the database stores submitted text to support the analysis history. Production deployment should add appropriate retention, deletion, and privacy controls before handling real users' resumes.
