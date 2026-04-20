#!/usr/bin/env bash
# Create the labels used by the Claude Issue Agent workflow.
# Run once after merging the agent-pattern PR. Requires `gh auth login`.

set -euo pipefail

create_or_update() {
  local name="$1"
  local color="$2"
  local description="$3"
  if gh label list --json name -q '.[].name' | grep -qx "$name"; then
    gh label edit "$name" --color "$color" --description "$description"
  else
    gh label create "$name" --color "$color" --description "$description"
  fi
}

create_or_update "agent-ready"        "0e8a16" "Maintainer applied this label; triggers the Claude issue-agent workflow."
create_or_update "agent-in-progress"  "fbca04" "Agent run is currently active for this issue."
create_or_update "agent-needs-human"  "d73a4a" "Agent is blocked on a question. Will not retry until resolved."
create_or_update "type:docs"          "0075ca" "Docs/notes task — agent edits only docs, README, prd.md."
create_or_update "type:code"          "5319e7" "Code task — agent edits source under packages/, apps/, tools/."

echo "Labels created/updated."
