# Contributing

## Branching model
| Branch | Purpose | Who can push |
|---|---|---|
| `main` | Production-ready code, tagged releases | Pull request only (protected) |
| `develop` | Integration branch for the next release | Pull request only (protected) |
| `feature/<topic>` | One feature or task, e.g. `feature/auth-layer` | Author |
| `fix/<topic>` | Bug fixes | Author |

Flow: `feature/*` -> pull request -> `develop` -> pull request -> `main`.

## Protection rules (see `scripts/protect-branches.sh`)
- Pull request required; with a team: at least 1 approval and code-owner review, stale approvals dismissed (working alone: set approvals to 0, because GitHub does not let you approve your own pull request)
- Status checks `backend` and `frontend` must pass, branch must be up to date
- No force pushes, no branch deletion, linear history, admins included
- Local safety net: `git config core.hooksPath .githooks` blocks direct pushes to `main` and `develop`

## Commit messages (Conventional Commits)
`feat:` new feature, `fix:` bug fix, `test:` tests, `docs:` documentation, `chore:` tooling, `ci:` pipelines.
Example: `feat(auth): add login with account lockout`.

## Security rules
- Never commit `.env` files, keys, or tokens (`.gitignore` blocks `.env`).
- Every tenant-scoped query must filter by the authenticated user's id.
