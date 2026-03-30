# Ethics and Responsible Use

Poltergeist simulates the review style of real contributors. Used thoughtfully, it preserves institutional knowledge and improves review coverage. Used carelessly, it can misrepresent people, create false confidence in reviews, or be used without a contributor's awareness.

This document sets out the norms we recommend.

---

## Get consent first

Before building a ghost for a contributor, ask them.

Most contributors will say yes — it's genuinely flattering to have your review instincts captured and trusted enough to stand in for you. But they have a right to know, and they may want input on their own ghost file.

If a contributor has left the organisation and you can't ask them, use judgment: a ghost based on their public contributions is generally fine; a ghost based on private Slack messages is more sensitive.

---

## Ghosts are simulations, not verdicts

Every poltergeist review ends with a footer that makes the simulation explicit:

```
_Simulated review · poltergeist · ghost: ghosts/[slug].md · updated [date]_
```

Never remove this footer. Never present a poltergeist review as if it came from the contributor directly.

---

## Don't use ghosts to override human judgment

A poltergeist review is an additional perspective, not a final authority. It should never:

- Be the sole approval for a merge
- Override a living contributor's actual review
- Be used to settle disputes ("well, Alice's ghost approved it")

---

## Keep ghosts accurate

An outdated or inaccurate ghost is worse than no ghost. If a ghost consistently misrepresents a contributor — missing their current priorities, using patterns they've moved on from — update it or retire it.

The `Soul last updated` field exists for a reason. If a ghost hasn't been updated in six months and the codebase or the contributor's patterns have changed, mark it as stale or archive it.

---

## Don't build ghosts from private data without permission

The extractor can process Slack exports and design docs. Some of that content was written in contexts where the contributor didn't expect it to be analysed or stored in a profile. Use discretion about which Slack channels and which content you include.

A good rule of thumb: if the contributor would be surprised or uncomfortable seeing a particular message in their ghost file, don't include it.

---

## Understand the limits

Poltergeist captures **style and heuristics**, not knowledge. A ghost cannot:

- Know about architectural decisions made after the ghost was last updated
- Review code in domains outside the contributor's expertise
- Replace a real conversation when something is genuinely ambiguous
- Account for how a contributor's views have changed

The "Out of scope for this ghost" section in every review exists precisely to surface these limits.

---

## Summary

| Do | Don't |
|---|---|
| Ask before building a ghost | Build a ghost without the contributor's knowledge |
| Keep ghosts up to date | Use a stale ghost as authoritative |
| Use ghosts as additional perspective | Use ghosts as the only approval path |
| Be transparent about simulation | Present ghost reviews as real reviews |
| Archive ghosts that are no longer accurate | Leave outdated ghosts active |
