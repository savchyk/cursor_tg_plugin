# 15 — Cursor Marketplace submission

## Goal

Prepare and submit this single-plugin repo to the Cursor Marketplace.

## Prerequisites

- [02-npm-publish](02-npm-publish.md) done so end users get MCP via `npx` without cloning build steps (or document “build mcp first” if staying git-only — prefer npm).
- Valid [`.cursor-plugin/plugin.json`](../.cursor-plugin/plugin.json), logo, skills frontmatter.
- `node scripts/validate-template.mjs` passes.

## Approach

1. Fill author/email/license/keywords in plugin.json for real identity.
2. README: install from Marketplace + required secrets.
3. Follow Cursor submission path (team Slack / email per original template: `kniparko@anysphere.com` or current docs).
4. Checklist commit of any marketplace-required fields only (no secrets).

## Acceptance

- Submission package validates cleanly.
- External user can install and run bot `get_me` with only a token.

## Todos

- [ ] Polish plugin.json metadata
- [ ] Marketplace-oriented README section
- [ ] Run validator
- [ ] Submit (human step)
