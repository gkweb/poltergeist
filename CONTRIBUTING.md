# Contributing to poltergeist

Thanks for your interest. Contributions are welcome in the following areas:

---

## Ghost quality

The best contributions are improvements to the ghost schema and review format based on real usage. If you've used poltergeist and found that certain ghost fields produce better or worse voice fidelity — open an issue or PR.

---

## Extractor improvements

The CLI (`@poltergeist-ai/cli` in `packages/cli/`) currently supports:
- Git history
- GitHub PR review comments (auto-detected from GitHub URLs)
- GitLab MR comments (JSON export)
- Slack exports (standard export format)
- Local docs directories

PRs adding support for additional sources are welcome:
- Linear comments
- Notion docs
- Jira comments

If adding a new source, follow the existing pattern in `packages/cli/src/extractors/`:
1. Add a new `packages/cli/src/extractors/<source>.ts` with `extract<Source>Signals()` and `summarise<Source>()` functions
2. Add types to `packages/cli/src/types.ts`
3. Wire into `packages/cli/src/cli.ts` with a new `--<source>` CLI argument
4. Re-export from `packages/cli/src/index.ts`
5. Update the README data sources table

---

## Bug reports

Use the GitHub issue tracker. Include:
- What you ran
- What you expected
- What actually happened
- Relevant ghost file sections (redact any private info)

---

## Ghost inaccuracy reports

If a ghost produces reviews that consistently misrepresent a contributor, use the `ghost_feedback` issue template. This helps us improve the schema and extraction heuristics over time.

---

## Code style

- TypeScript: zero runtime dependencies, Node.js stdlib only
- Package manager: pnpm (workspace monorepo)
- Markdown: consistent heading levels, no trailing whitespace
- Ghost files: follow the schema in `packages/plugin/skills/poltergeist/references/ghost-schema.md` exactly

---

## Licence

By contributing, you agree that your contributions will be licensed under the MIT licence.
