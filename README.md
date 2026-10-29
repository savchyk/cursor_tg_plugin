# Telegram for Cursor

Cursor plugin with **two** MCP servers so agents (including Grok) can use Telegram as a **bot** and/or your **personal account**.

| Server | Identity | Auth |
| --- | --- | --- |
| `telegram-bot` | BotFather bot(s) | `TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_<NAME>` / `~/.cursor-telegram/bot-token` |
| `telegram-user` | Your account (MTProto) | `TELEGRAM_API_ID` + `TELEGRAM_API_HASH` + login/session |

## Quick start

```bash
cd mcp && npm install && npm run build
cp .env.example .env   # from repo root; fill tokens
```

Open this repo in Cursor so [`mcp.json`](mcp.json) resolves `${workspaceFolder}` and loads `.env` via `envFile`. Reload MCP.

Smoke: `/telegram-setup` command, or call `get_me` (bot) / `auth_status` (user).

### Cursor can’t see my token

1. Use a workspace `.env` (not only shell `export` — GUI Cursor often lacks those).
2. Confirm `mcp.json` includes `"envFile": "${workspaceFolder}/.env"`.
3. Quit and reopen Cursor.
4. Or call `save_bot_token` / `save_api_credentials`.
5. Verify with `list_bots` / `auth_status`.

### Portable install (after npm publish)

See [`mcp.json.npx.example`](mcp.json.npx.example) (`npx -y cursor-telegram-mcp@0.1.0 bot|user`). Until published, use the local `node …/mcp/dist/cli.js` config.

## Tools (summary)

**Bot:** `list_bots`, `get_me`, `resolve_peer`, `send_message` / `send_photo` / `send_document`, edit/delete/react, `get_updates`, `acknowledge_updates`, `list_recent_chats`, webhook helpers.

**User:** credentials + phone/QR login, `resolve_peer`, dialogs/search/forum topics, `get_messages`, send text/photo/document, edit/delete/react.

Prompts: `unread-summary`, `draft-reply`. Resources: `telegram://bot/me`, `telegram://user/me`.

## Skills & rules

- Skills: mode guide, bot/user setup, send confirmation
- Rule: `telegram-default-identity` (prefer bot unless asked for personal account)
- Command: `telegram-setup`

## Develop

```bash
cd mcp && npm test          # unit + listTools smoke
node scripts/validate-template.mjs
```

CI: `.github/workflows/ci.yml`.

Optional inbound worker scaffold: [`bridge/`](bridge/).

## Security

Treat tokens, api_hash, and sessions as secrets. Default data dir `~/.cursor-telegram/` (0700/0600). Confirm every outbound send. User-account automation should stay personal and low-volume.

## Marketplace

Plugin manifest: [`.cursor-plugin/plugin.json`](.cursor-plugin/plugin.json). Validate, publish npm package, then submit per current Cursor Marketplace process.
