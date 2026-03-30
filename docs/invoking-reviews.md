---
title: Invoking Reviews
---

# Invoking Reviews

Once you have a ghost file, invoke a review by passing code to your AI tool with a reference to the ghost.

## Invocation patterns

### Review a diff

```bash
git diff main | claude "review this as @alice-smith"
```

### Review a specific file

```bash
claude "what would alice think of this?" < src/components/MyForm.vue
```

### Review an open MR

```bash
claude "review MR !123 as @alice-smith"
```

Requires the [glab CLI](https://gitlab.com/gitlab-org/cli) for fetching MR diffs.

### Alternative phrasings

All of these work:

- "review as @alice-smith"
- "review with alice's lens"
- "what would alice say about this"
- "summon alice's ghost"

## Reading the output

Every review follows a fixed structure. Here's an example:

```markdown
## Review by Alice Smith
> `src/components/SubmitForm.vue`

---

### Blocking
- **src/components/SubmitForm.vue:42** — No error handling on the API call.
  What does the user see if this 500s?

---

### Suggestions
- **src/components/SubmitForm.vue:15** — I'd lean towards `useSubmissionState`
  rather than `submissionHelper` — the `use` prefix makes it clear it's a composable.
- **src/components/SubmitForm.vue:78** — This component is doing two things —
  can we split the validation logic into its own composable?

---

### Nits
- **src/components/SubmitForm.vue:23** — `handleClick` doesn't say much —
  `onSubmit` would be clearer.

---

### What's good
This is clean. Nice use of the composable pattern.

---

### Overall
Happy path looks good, but the missing error handling on the submit
call is a blocker. Fix that and this is ready to go.

---

### Out of scope for this ghost
- Accessibility (aria attributes, keyboard navigation) — not typically reviewed by Alice
- Loading states — not typically reviewed by Alice
- Mobile / responsive edge cases — not typically reviewed by Alice

---
_Simulated review · poltergeist · ghost: .poltergeist/ghosts/alice-smith.md · updated 2025-01-15_
_Sources: git-history, gitlab-comments, slack-export_
```

### Section breakdown

| Section | What it means |
|---|---|
| **Blocking** | Issues that match the ghost's dealbreakers. Must resolve before merge. |
| **Suggestions** | Substantive, non-blocking feedback. Ordered by the ghost's ranked values. |
| **Nits** | Minor style/naming issues. Only present if the contributor typically leaves nits. |
| **What's good** | Positive feedback. Only present if the contributor typically gives positive feedback. |
| **Overall** | 1-3 sentence verdict in the contributor's voice. |
| **Out of scope** | Areas the ghost doesn't cover. Pulled from Known Blind Spots. Always present. |
| **Footer** | Simulation disclosure. Always present. Never remove. |

## Using reviews in your workflow

Ghost reviews are an **additional perspective**, not a replacement for human review.

**Do:**
- Use them to get early feedback before requesting human review
- Use them when the contributor is unavailable (on leave, busy, moved on)
- Use them to preserve institutional knowledge from senior contributors
- Treat "Out of scope" as a checklist for what still needs human eyes

**Don't:**
- Use a ghost review as the sole approval for a merge
- Override a living contributor's actual review with their ghost's opinion
- Present ghost reviews as if they came from the contributor directly

See [Ethics](./ethics) for full responsible use guidelines.
