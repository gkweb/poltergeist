# Review Format

How Claude structures and writes a poltergeist review.

---

## Guiding principles

1. **Voice first** — The review should sound like them, not like Claude. Read their vocabulary, tone, and example comments before writing a word.

2. **Their lens, not a complete lens** — Only surface issues this contributor would surface. A review "as Alice" is not a comprehensive audit. It's Alice's perspective.

3. **Ordered by their priorities** — Surface issues in the order their ghost ranks them. Correctness before naming. Naming before nits.

4. **Match their density** — If they're terse, produce five comments. If they're thorough, produce fifteen. Don't inflate the review.

5. **Acknowledge blind spots** — At the end, list what falls outside this ghost's typical scope. Don't silently skip things — surface the gap so the team can act on it.

---

## Output structure

```
## 👻 Review by [Name]
> `[filename or MR description]`

---

### 🔴 Blocking
<!-- Only if blocking issues exist. Use their blocking criteria from the ghost. -->

- **[File:line or area]** — [Comment in their voice]

---

### 💬 Suggestions
<!-- Non-blocking but substantive. -->

- **[File:line or area]** — [Comment in their voice]

---

### 🔹 Nits
<!-- Minor style / naming / etc. Only include if this contributor leaves nits. -->

- **[File:line or area]** — [Comment in their voice]

---

### ✅ What's good
<!-- Optional. Only include if this contributor leaves positive feedback.
     Match their style: sparse, genuine, brief. -->

---

### Overall
<!-- 1–3 sentences. Their verdict in their voice.
     Would they approve? Request changes? What's the one thing they'd want resolved? -->

---

### 👻 Out of scope for this ghost
<!-- List blind spots and areas this ghost doesn't cover.
     Always include this section. -->

- [area] — not typically reviewed by [Name]

---
_Simulated review · poltergeist · ghost: ghosts/[slug].md · updated [date]_
_Sources: [git-history | gitlab-comments | slack | docs]_
```

---

## Section rules

### Blocking

Only include if the ghost's **Dealbreakers** criteria are triggered. Don't invent blocking issues — if this contributor wouldn't block for it, it doesn't go here.

### Suggestions

The main body of the review. Order by the ghost's ranked values: correctness issues first, naming second, abstraction concerns third, etc.

### Nits

Only include if the ghost is known to leave nits (check their severity prefixes in the ghost file). If they don't leave nits, omit this section entirely — don't invent minor feedback they wouldn't bother with.

### What's good

Only include if the ghost is known to leave positive feedback. Sparse reviewers who never say "nice work" should not get a section that puts those words in their mouth. If they do leave positive feedback, match their cadence — one or two brief notes, not a paragraph of praise.

### Overall

One to three sentences. This is the most voice-sensitive section. Read their example comments carefully before writing this. If they're a "request changes unless everything is clean" type, reflect that. If they tend to approve with minor suggestions, reflect that instead.

### Out of scope for this ghost

Always include this section. Pull directly from the ghost's **Known Blind Spots**. This section is not optional — it ensures the team knows where the simulated review ends and a real review may still be needed.

---

## Tone calibration examples

**Terse and direct:**
> `blocking:` No error handling on the API call. What does the user see if this 500s?

**Warm and collaborative:**
> `blocking:` One thing before this merges — the API call on line 42 doesn't handle errors yet. Worth a quick try/catch and a fallback state?

**Question-driven:**
> `question:` Do we need both the `v-if` and the `loading` prop here? Wondering if one can drive the other.

**Terse positive:**
> This is clean.

Match the *specific* contributor's style from their ghost, not a generic style.

---

## Confidence signalling

Where Claude is inferring (not directly supported by ghost data), signal it lightly — once or twice per review maximum:

> _(inferred from patterns — no direct example from [Name] for this case)_

Don't overuse this. It should mark genuine inference, not every comment.

---

## Diff reading strategy

1. Read the full diff before commenting
2. Group related comments (all naming issues together under nits, etc.)
3. For large diffs, prioritise by the ghost's ranked values — don't try to cover everything
4. Note anything that falls in the ghost's blind spots for the "Out of scope" section
