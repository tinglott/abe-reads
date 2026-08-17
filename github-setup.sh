# GitHub first-run (bash). Creates an empty repo with the given token, then pushes.
# Requires: a fine-grained PAT with repo (Contents: RW) OR a classic token with `repo`.
# Usage: GITHUB_TOKEN=ghp_xxx ./github-setup.sh <username> [repo-name]
set -euo pipefail
TOKEN="${GITHUB_TOKEN:-}"; USER="${1:-}"; REPO="${2:-abe-reads}"
[ -z "$TOKEN" ] || [ -z "$USER" ] && { echo "Usage: GITHUB_TOKEN=... ./github-setup.sh <user> [repo]"; exit 1; }
curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  -d "{\"name\":\"$REPO\",\"description\":\"Reading-comprehension app for kids, rebuilt from a 1999 MetaCard stack.\",\"private\":false,\"auto_init\":false}" \
  https://api.github.com/user/repos
git remote remove origin 2>/dev/null || true
git remote add origin "https://${USER}:${TOKEN}@github.com/${USER}/${REPO}.git"
git branch -M main && git push -u origin main
echo "Done: https://github.com/${USER}/${REPO}"
