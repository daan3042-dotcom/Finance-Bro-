#!/usr/bin/env bash
# PreToolUse hook on `git commit`: blocks the commit unless docs/LOGBOOK.md
# is staged too, so every functional change gets a logboek entry.
set -euo pipefail

staged="$(git diff --cached --name-only 2>/dev/null || true)"

# Nothing staged (e.g. `git commit -a` with nothing to commit, or a
# non-repo edge case) — let git itself report that.
if [ -z "$staged" ]; then
  exit 0
fi

# A commit that only touches the logbook (or is empty besides it) is fine.
if [ "$staged" = "docs/LOGBOOK.md" ]; then
  exit 0
fi

if echo "$staged" | grep -qx "docs/LOGBOOK.md"; then
  exit 0
fi

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Deze commit wijzigt bestanden maar docs/LOGBOOK.md is niet meegestaged. Voeg eerst een regel toe onder de datum van vandaag in docs/LOGBOOK.md die samenvat wat er is veranderd, doe `git add docs/LOGBOOK.md`, en commit dan opnieuw."
  }
}
EOF
exit 0
