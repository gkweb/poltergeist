---
title: Contributing
---

# Contributing

Thanks for your interest. Contributions are welcome in the following areas.

## Ghost quality

The best contributions are improvements to the ghost schema and review format based on real usage. If you've used poltergeist and found that certain ghost fields produce better or worse voice fidelity — open an issue or PR.

## Extractor improvements

The CLI currently supports git history, GitHub PRs, GitLab MRs, Slack exports, and local docs. PRs adding support for additional sources are welcome:

- Linear comments
- Notion docs
- Jira comments

### Adding a new source

Follow the existing pattern in `packages/cli/src/extractors/`:

1. Add `packages/cli/src/extractors/<source>.ts` with `extract<Source>Signals()` and `summarise<Source>()` functions
2. Add types to `packages/cli/src/types.ts`
3. Wire into `packages/cli/src/cli.ts` with a new `--<source>` CLI argument
4. Re-export from `packages/cli/src/index.ts`
5. Update the data sources documentation

## New integrations

Poltergeist is tool-agnostic by design. Ghost files are plain markdown that any AI tool can consume. If you'd like to add support for a new AI coding tool (Codex, Cursor, Aider, etc.), the integration layer is intentionally thin — see [Codex](./codex) for the architecture.

## Bug reports

Use the [GitHub issue tracker](https://github.com/gkweb/poltergeist/issues). Include:

- What you ran
- What you expected
- What actually happened
- Relevant ghost file sections (redact any private info)

## Ghost inaccuracy reports

If a ghost produces reviews that consistently misrepresent a contributor, use the `ghost_feedback` issue template. This helps improve the schema and extraction heuristics over time.

## Code style

- TypeScript: zero runtime dependencies, Node.js stdlib only
- Package manager: pnpm (workspace monorepo)
- Markdown: consistent heading levels, no trailing whitespace
- Ghost files: follow the schema in [Ghost Schema](./ghost-schema) exactly

## Licence

By contributing, you agree that your contributions will be licensed under the MIT licence.
