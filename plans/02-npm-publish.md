# 02 — npm publish + portable mcp.json

**Status: Prep only** — package ready; **not published** (needs `npm login`)

## Goal

Install MCP servers anywhere via `npx`, not only inside this workspace’s `mcp/dist`.

## Implemented (prep)

| Item | Location |
| --- | --- |
| Package metadata, `bin`, `files`, `prepublishOnly` | [`mcp/package.json`](../mcp/package.json) |
| Package README | [`mcp/README.md`](../mcp/README.md) |
| npx config example | [`mcp.json.npx.example`](../mcp.json.npx.example) |
| Dev still uses local dist | [`mcp.json`](../mcp.json) → `node …/mcp/dist/cli.js` |

## Remaining

1. `npm login` (or automation token)
2. From `mcp/`: `npm publish --access public`
3. Optionally point live [`mcp.json`](../mcp.json) at `npx -y cursor-telegram-mcp@0.1.0 bot|user` (keep local-dev snippet in README)
4. Fix `repository.url` in `package.json` to the real git remote before publish

## Acceptance

- [x] Package build/metadata ready (`prepublishOnly`, `files`)
- [x] npx example config committed
- [ ] Package visible on npm
- [ ] `npx -y cursor-telegram-mcp@0.1.0 bot` starts stdio MCP

## Todos

- [x] Package metadata + `files` + `prepublishOnly`
- [ ] Publish npm package (`npm login` required)
- [x] npx example config; local-dev remains default `mcp.json`
- [x] README install section mentions npx example
