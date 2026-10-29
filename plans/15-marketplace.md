# 15 — Cursor Marketplace submission

**Status: Polish complete — submit is a human step**

## Goal

Submit this single-plugin repo to the Cursor Marketplace.

## Ready in repo

| Item | Location |
| --- | --- |
| Manifest | [`.cursor-plugin/plugin.json`](../.cursor-plugin/plugin.json) |
| Logo | [`assets/logo.svg`](../assets/logo.svg) |
| Skills / command / rule frontmatter | validate via `node scripts/validate-template.mjs` |
| Install + secrets docs | [`README.md`](../README.md) |

## Recommended before submit

1. Complete [02-npm-publish](02-npm-publish.md) so installs work via `npx` without a local build
2. Set real `author` / `repository` fields
3. Re-run validator
4. Submit via current Cursor Marketplace process (docs/email/team channel)

## Acceptance

- [x] Validator clean
- [x] README install/secrets documented
- [ ] External user install after Marketplace listing
- [ ] Submission filed

## Todos

- [x] Polish plugin.json metadata (v0.1.0 baseline)
- [x] Marketplace-oriented README section
- [x] Run validator
- [ ] Submit (human)
