# 02 — npm publish + portable mcp.json

## Goal

Install the MCP servers anywhere via `npx`, not only inside this workspace’s `mcp/dist`.

## Why

Marketplace / other projects need a package name. Current [`mcp.json`](../mcp.json) hard-codes `${workspaceFolder}/mcp/dist/cli.js`.

## Approach

1. Finalize [`mcp/package.json`](../mcp/package.json): name `cursor-telegram-mcp`, `bin`, `files` (`dist/**`), `engines`, license, repository URL.
2. Ensure `npm run build` is required before publish; add `"prepublishOnly": "npm run build"`.
3. Publish to npm (user must be logged in: `npm publish --access public`).
4. Change root `mcp.json` to:

```json
{
  "mcpServers": {
    "telegram-bot": {
      "command": "npx",
      "args": ["-y", "cursor-telegram-mcp@0.1.0", "bot"],
      "envFile": "${workspaceFolder}/.env",
      "env": { "TELEGRAM_BOT_TOKEN": "${env:TELEGRAM_BOT_TOKEN}" }
    },
    "telegram-user": {
      "command": "npx",
      "args": ["-y", "cursor-telegram-mcp@0.1.0", "user"],
      "envFile": "${workspaceFolder}/.env",
      "env": {
        "TELEGRAM_API_ID": "${env:TELEGRAM_API_ID}",
        "TELEGRAM_API_HASH": "${env:TELEGRAM_API_HASH}",
        "TELEGRAM_SESSION": "${env:TELEGRAM_SESSION}"
      }
    }
  }
}
```

5. Keep a `mcp.json.local-dev` (or README snippet) for `node ${workspaceFolder}/mcp/dist/cli.js` during development.
6. Tag git `v0.1.0` after publish (only if user asks for tag/commit).

## Depends on

- Prefer completing [01-env-wiring](01-env-wiring.md) first so published config includes `envFile`.

## Acceptance

- `npx -y cursor-telegram-mcp@0.1.0 bot` starts stdio MCP.
- `npm run smoke` still passes against local `dist` (dev) and optionally against npx.

## Todos

- [ ] Package metadata + `files` + `prepublishOnly`
- [ ] Publish npm package
- [ ] Switch `mcp.json` to npx; keep local-dev instructions
- [ ] README install section update
