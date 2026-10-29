#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): typecheck the workspace that owns the edited
# TypeScript file. Exit 2 with the errors on stderr so Claude sees them at once.
set -u
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
file="$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(String((j.tool_response&&j.tool_response.filePath)||(j.tool_input&&j.tool_input.file_path)||""))}catch{}})')"
file="${file//\\//}"
case "$file" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac
case "$file" in
  */packages/core/*) ws="packages/core" ;;
  */apps/web/*) ws="apps/web" ;;
  *) exit 0 ;;  # e2e/ and config files have no tsconfig of their own
esac
cd "$root" || exit 0
out="$(npm run --silent typecheck -w "$ws" 2>&1)"
code=$?
if [ "$code" -ne 0 ]; then
  printf 'Typecheck failed in %s after editing %s:\n%s\n' "$ws" "${file##*/}" "$(printf '%s\n' "$out" | grep -E 'error TS|^src/' | head -20)" >&2
  exit 2
fi
exit 0
