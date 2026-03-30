# Exporting GitLab MR Comments

GitLab MR comments are the most valuable data source for ghost voice fidelity. This guide covers how to export them.

---

## What you need

- A GitLab personal access token with `read_api` scope
- The numeric project ID (visible in the project's Settings → General page, or from the API)
- Enough review history — aim for at least 30–50 comments from the contributor

---

## Option 1: Quick script (recommended)

Save this as `export-gitlab-comments.sh` and run it:

```bash
#!/bin/bash
# Export all MR notes for a project to a single JSON file
#
# Usage:
#   GITLAB_TOKEN=glpat-xxx PROJECT_ID=12345 ./export-gitlab-comments.sh
#   GITLAB_TOKEN=glpat-xxx PROJECT_ID=12345 GITLAB_HOST=gitlab.yourcompany.com ./export-gitlab-comments.sh

GITLAB_HOST="${GITLAB_HOST:-gitlab.com}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
TOKEN="${GITLAB_TOKEN:?Set GITLAB_TOKEN}"
OUTPUT="gitlab-notes-${PROJECT_ID}.json"

echo "Fetching MR list..."
MR_IDS=$(curl -s \
  "https://${GITLAB_HOST}/api/v4/projects/${PROJECT_ID}/merge_requests?per_page=100&state=merged" \
  -H "PRIVATE-TOKEN: ${TOKEN}" | jq -r '.[].iid')

echo "Found $(echo "$MR_IDS" | wc -l | tr -d ' ') MRs"

ALL_NOTES="[]"
for IID in $MR_IDS; do
  NOTES=$(curl -s \
    "https://${GITLAB_HOST}/api/v4/projects/${PROJECT_ID}/merge_requests/${IID}/notes?per_page=100" \
    -H "PRIVATE-TOKEN: ${TOKEN}")
  ALL_NOTES=$(echo "$ALL_NOTES $NOTES" | jq -s 'add')
  printf "."
done

echo ""
echo "$ALL_NOTES" > "$OUTPUT"
echo "Done → $OUTPUT ($(echo "$ALL_NOTES" | jq 'length') notes)"
```

Then pass the output to the extractor:

```bash
python scripts/extract_soul.py \
  --contributor "Alice Smith" \
  --gitlab-export ./gitlab-notes-12345.json \
  --output ghosts/alice-smith.md
```

---

## Option 2: Using the GitLab API directly

### Get your project ID

```bash
curl "https://gitlab.com/api/v4/projects?search=your-repo-name" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[].id'
```

### Fetch MR notes for a single MR

```bash
curl "https://gitlab.com/api/v4/projects/:id/merge_requests/:iid/notes" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN"
```

### Paginate for large projects

The API returns 20 results per page by default. Use `?per_page=100&page=N` to paginate:

```bash
curl "https://gitlab.com/api/v4/projects/:id/merge_requests?per_page=100&page=2" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN"
```

---

## Option 3: glab CLI

If you have `glab` installed:

```bash
# List MRs
glab mr list --state merged --per-page 100

# Get notes for a specific MR
glab api "projects/:fullpath/merge_requests/123/notes"
```

---

## Expected JSON format

The extractor expects a flat JSON array of note objects. Each object should have at minimum:

```json
[
  {
    "author": { "name": "Alice Smith" },
    "body": "nit: I'd rename this to useSubmissionState",
    "type": "DiffNote"
  }
]
```

The extractor also handles the per-MR nested format:

```json
[
  {
    "iid": 42,
    "notes": [
      { "author": { "name": "Alice Smith" }, "body": "..." }
    ]
  }
]
```

---

## Privacy note

The GitLab export includes comments by all team members, not just the target contributor. The extractor filters by contributor name — but be mindful that you're pulling the full comment history of your project. Store exports securely and don't commit them to public repos.

Consider adding `exports/` to your `.gitignore`.
