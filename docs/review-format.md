---
title: Review Format
---

# Review Format

How poltergeist structures and writes a simulated review.

## Guiding principles

1. **Voice first** — The review should sound like them, not like a generic AI. Read their vocabulary, tone, and example comments before writing a word.

2. **Their lens, not a complete lens** — Only surface issues this contributor would surface. A review "as Alice" is not a comprehensive audit. It's Alice's perspective.

3. **Ordered by their priorities** — Surface issues in the order their ghost ranks them. Correctness before naming. Naming before nits.

4. **Match their density** — If they're terse, produce five comments. If they're thorough, produce fifteen. Don't inflate.

5. **Acknowledge blind spots** — At the end, list what falls outside this ghost's typical scope. Don't silently skip things.

## Output structure

```markdown
## Review by [Name]
> `[filename or MR description]`

---

### Blocking
- **[File:line or area]** — [Comment in their voice]

---

### Suggestions
- **[File:line or area]** — [Comment in their voice]

---

### Nits
- **[File:line or area]** — [Comment in their voice]

---

### What's good
[Optional — only if this contributor leaves positive feedback]

---

### Overall
[1-3 sentences. Their verdict in their voice.]

---

### Out of scope for this ghost
- [area] — not typically reviewed by [Name]

---
_Simulated review · poltergeist · ghost: .poltergeist/ghosts/[slug].md · updated [date]_
_Sources: [git-history | gitlab-comments | slack | docs]_
```

## Section rules

### Blocking

Only include if the ghost's **Dealbreakers** are triggered. Don't invent blocking issues — if this contributor wouldn't block for it, it doesn't go here.

### Suggestions

The main body of the review. Order by the ghost's ranked values: correctness issues first, naming second, abstraction concerns third, etc.

### Nits

Only include if the ghost is known to leave nits (check their severity prefixes). If they don't leave nits, omit this section entirely.

### What's good

Only include if the ghost is known to leave positive feedback. Sparse reviewers who never say "nice work" should not get a section that puts those words in their mouth.

### Overall

One to three sentences. This is the most voice-sensitive section. If they're a "request changes unless everything is clean" type, reflect that. If they tend to approve with minor suggestions, reflect that instead.

### Out of scope for this ghost

**Always include.** Pull directly from the ghost's Known Blind Spots. This ensures the team knows where the simulated review ends and a real review may still be needed.

### Footer

**Always include.** Makes the simulation explicit. Never remove.

## Tone calibration examples

**Terse and direct:**
> `blocking:` No error handling on the API call. What does the user see if this 500s?

**Warm and collaborative:**
> `blocking:` One thing before this merges — the API call on line 42 doesn't handle errors yet. Worth a quick try/catch and a fallback state?

**Question-driven:**
> `question:` Do we need both the `v-if` and the `loading` prop here? Wondering if one can drive the other.

**Terse positive:**
> This is clean.

Match the specific contributor's style from their ghost, not a generic style.

## Confidence signalling

Where the review is inferring (not directly supported by ghost data), signal it lightly — once or twice per review maximum:

> _(inferred from patterns — no direct example from [Name] for this case)_

Don't overuse this. It should mark genuine inference, not every comment.
