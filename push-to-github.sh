#!/usr/bin/env bash
# Push Abe Reads to GitHub.
#
# Usage:
#   1. Create an empty repo at https://github.com/new  (name e.g. "abe-reads",
#      NO README/license — the project already has them).
#   2. Create a token: GitHub -> Settings -> Developer settings -> Fine-grained
#      PAT with "Contents: Read and write".
#   3. Run:  GITHUB_TOKEN=ghp_xxx  ./push-to-github.sh  YOUR_USERNAME
#
# The script adds the remote (using the token for auth) and pushes main.
set -euo pipefail

TOKEN="${GITHUB_TOKEN:-}"
USER="${1:-}"
REPO="${2:-abe-reads}"

if [ -z "$TOKEN" ] || [ -z "$USER" ]; then
  echo "Usage: GITHUB_TOKEN=<token> ./push-to-github.sh <github-username> [repo-name]" >&2
  exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://${USER}:${TOKEN}@github.com/${USER}/${REPO}.git"
git branch -M main
git push -u origin main
echo "Pushed to https://github.com/${USER}/${REPO}"
