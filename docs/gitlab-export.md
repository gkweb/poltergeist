---
title: Exporting GitLab MR Comments
---

# Exporting GitLab MR Comments

GitLab MR comments are the most valuable data source for ghost voice fidelity. This guide covers how to export them using the [glab CLI](https://gitlab.com/gitlab-org/cli).

## Prerequisites

- [glab CLI](https://gitlab.com/gitlab-org/cli) installed and authenticated
- Enough review history — aim for at least 30-50 comments from the contributor

## Export MR comments

### 1. List merged MRs

```bash
glab mr list --state merged --per-page 100
```

### 2. Export notes to JSON

Export all MR notes for your project into a single file:

```bash
glab api "projects/:fullpath/merge_requests?state=merged&per_page=100" \
  | jq -r '.[].iid' \
  | while read IID; do
      glab api "projects/:fullpath/merge_requests/$IID/notes?per_page=100"
    done \
  | jq -s 'add' > gitlab-notes.json
```

### 3. Pass to the extractor

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --gitlab-export ./gitlab-notes.json \
  --output .poltergeist/ghosts/alice-smith.md
```

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

## Privacy note

The export includes comments by all team members, not just the target contributor. The extractor filters by contributor name — but be mindful that you're pulling the full comment history of your project. Store exports securely and don't commit them to public repos.

Consider adding `exports/` to your `.gitignore`.
