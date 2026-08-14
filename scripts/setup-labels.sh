#!/usr/bin/env bash
# Creates the Kaizen-80 label taxonomy for the agentic workflow.
# Safe to re-run: existing labels are skipped, not duplicated/errored on.
#
# Usage: ./setup-labels.sh [owner/repo]
# Defaults to the repo of the current directory if no argument is given.

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

echo "Setting up labels on: $REPO"

create_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  if gh label list --repo "$REPO" --json name -q '.[].name' | grep -qx "$name"; then
    echo "  ✓ already exists: $name"
  else
    gh label create "$name" \
      --repo "$REPO" \
      --color "$color" \
      --description "$description"
    echo "  + created: $name"
  fi
}

# Trigger label — you apply this manually to a well-formed issue
create_label "agent:build"        "1D76DB" "Ready for the Builder Agent to pick up"

# State machine labels — the agent workflows manage these; you shouldn't need to touch them
create_label "status:building"    "FBCA04" "Builder Agent is actively working this issue"
create_label "status:qa-review"   "0E8A16" "PR opened, QA Agent is evaluating"
create_label "status:qa-failed"   "D93F0B" "QA Agent rejected the PR; retry pending or exhausted"
create_label "status:needs-human" "B60205" "Retry budget exhausted or QA flagged something structural"
create_label "status:merged"      "5319E7" "Auto-merged by the agent loop"

echo "Done."
