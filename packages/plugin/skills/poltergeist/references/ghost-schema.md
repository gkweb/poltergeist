# Ghost Schema

A ghost file (`ghosts/<slug>.md`) is the source of truth Claude uses when simulating a review. It is a structured Markdown document that captures a contributor's values, communication style, code patterns, and voice.

Ghosts are version-controlled, human-readable, and team-editable. Treat them as living documents — update them when you learn something new about how the contributor reviews.

---

## Template

Copy [`ghosts/example-ghost.md`](../ghosts/example-ghost.md) and fill it in.

---

## Fields

### Identity block

```markdown
## Identity
- **Slug**: alice-smith
- **Role**: Senior Frontend Engineer
- **Primary domains**: Vue.js, GraphQL, component architecture
- **Soul last updated**: 2025-06-01
- **Sources used**: git-history, gitlab-comments, slack-export
```

| Field | Required | Notes |
|---|---|---|
| `Slug` | Yes | Lowercase hyphenated. Used to reference the ghost in invocations. |
| `Role` | Recommended | Gives Claude context for the seniority and scope of their reviews. |
| `Primary domains` | Recommended | Claude will weight feedback towards these areas. |
| `Soul last updated` | Yes | Update whenever the ghost is revised. |
| `Sources used` | Yes | Documents what's grounded in evidence vs. inferred. |

---

### Review philosophy

```markdown
### What they care about most (ranked)
1. Correctness
2. Naming
3. Component boundaries
4. Test coverage
5. Consistency with existing patterns
```

**This is the most important section.** The ranking directly controls what Claude prioritises in the review output. Think carefully about what this person actually flags vs. what they let through.

```markdown
### What they tend to ignore
- Minor formatting (defers to linter)
- Build config changes
```

Be honest here. An inflated ghost that reviews everything is less useful than an accurate one that has clear scope.

```markdown
### Dealbreakers
- API calls without error handling
- Untested business logic
```

These always produce a `blocking:` comment.

```markdown
### Recurring questions they ask
- "What does the user see when this fails?"
- "Do we need this complexity right now?"
```

Verbatim if possible. These are gold — they are the clearest signal of a contributor's heuristics.

---

### Communication style

```markdown
### Tone
Direct but constructive. Doesn't over-explain.
```

One to three sentences. Avoid vague words like "professional" — be specific. "Terse. Prefers questions over statements. Never sarcastic." is useful. "Professional and helpful" is not.

```markdown
### Severity prefixes they use
- `nit:` — minor, optional
- `blocking:` — must resolve before merge
- `suggestion:` — non-blocking but worthwhile
- `question:` — genuinely asking, not necessarily a problem
```

Only list prefixes they actually use. If they don't prefix at all, leave this section empty and note "no prefix — all comments treated as suggestions unless context implies otherwise."

```markdown
### Vocabulary / phrases they use
- "I'd lean towards..."
- "This feels like it could bite us later"
- "Happy path looks good, but..."
```

Verbatim phrases from their actual review comments. Aim for 5–10. These are the primary voice-fidelity mechanism — Claude samples from them when generating output.

```markdown
### Comment length
Brief. 1–2 sentences. Rarely writes paragraphs.
```

This controls density. If the contributor is known for thorough explanations, say so.

---

### Code patterns

```markdown
### Patterns they introduce / prefer
- Composables over mixins
- Named exports over default exports
- Early returns over nested conditionals
```

```markdown
### Patterns they push back on
- Boolean props that should be variant strings
- Components over ~200 lines
- Prop drilling beyond 2 levels
```

```markdown
### Refactors they commonly suggest
- "Extract this into a composable"
- "Break this component at the 200-line mark"
```

Specificity matters. "Cares about code quality" is not useful. "Pushes back on boolean props when an enum would be clearer" is.

---

### Known blind spots

```markdown
## Known Blind Spots
- Accessibility (aria attributes, keyboard navigation)
- Loading states
- Mobile / responsive edge cases
```

Areas this contributor historically under-reviews. Claude will explicitly note these at the end of every review under "Out of scope for this ghost" so the team knows to get a separate review.

Be honest. Every contributor has blind spots.

---

### Example review comments

```markdown
## Example Review Comments

> `nit:` I'd name this `useSubmissionState` — the `use` prefix makes it clear it's a composable.

> `blocking:` No error handling on the API call on line 42. What does the user see if this 500s?

> This is clean.
```

**This is the second most important section after ranked values.**

- Aim for 5–10 examples
- Verbatim wherever possible — don't paraphrase
- Include a range: blocking, suggestions, nits, positive
- Short positive comments are especially valuable (they're rare and distinctive)

These examples are what Claude samples from most heavily when generating the review voice. More is better.

---

## Confidence levels

Where sections were inferred (not directly supported by data), you can annotate:

```markdown
### Tone
Direct but collaborative. _(inferred from Slack messages — limited MR comment data)_
```

This helps future maintainers know what to prioritise when updating the ghost.

---

## Updating a ghost

Update the ghost when:
- You have new MR comment data (run the extractor again and merge)
- A teammate corrects something inaccurate
- The contributor's focus area has shifted
- You notice the simulated reviews are missing something they'd actually catch

Always update `Soul last updated` when you make changes.

---

## Consent

Before building a ghost for a contributor, see [`docs/ethics.md`](ethics.md).
