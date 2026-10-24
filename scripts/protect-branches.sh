#!/usr/bin/env bash
# Apply branch protection rules to GitHub (run once after the repo is pushed).
# Requires: GitHub CLI (`gh auth login`) and admin rights on the repository.
# Usage:   ./scripts/protect-branches.sh OWNER/REPO [required_approvals]
set -euo pipefail
REPO="${1:?usage: $0 OWNER/REPO [required_approvals]}"
APPROVALS="${2:-1}"   # use 0 if you work alone and cannot approve your own pull request

for BRANCH in main develop; do
  echo "Protecting $REPO:$BRANCH ..."
  gh api -X PUT "repos/$REPO/branches/$BRANCH/protection" --input - <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["backend", "frontend"] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": $APPROVALS,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
done
echo "Done. Verify under Settings > Branches."
