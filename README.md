# Telegram for Cursor

Cursor plugin that connects agents (including Grok) to Telegram through **two** MCP servers:

| Server | Identity | Protocol | Auth |
| --- | --- | --- | --- |
| `telegram-bot` | Your @BotFather bot | HTTP Bot API | `TELEGRAM_BOT_TOKEN` |
| `telegram-user` | Your personal account | MTProto (teleproto) | `TELEGRAM_API_ID` + `TELEGRAM_API_HASH` + login/session |

Enable one or both. The agent chooses tools by server name; skill `telegram-mode-guide` explains when to use which.

## Quick start

### 1. Build the MCP package

```bash
cd mcp
npm install
npm run build
```

### 2. Set credentials

**Bot:**

```bash
export TELEGRAM_BOT_TOKEN="123456:ABC..."
```

**User account** (from [my.telegram.org](https://my.telegram.org)):

```bash
export TELEGRAM_API_ID="1234567"
export TELEGRAM_API_HASH="your_api_hash"
# optional after first login:
# export TELEGRAM_SESSION="..."
```

### 3. Load MCP in Cursor

[`mcp.json`](mcp.json) registers both servers against `${workspaceFolder}/mcp/dist/cli.js`. Open this repo in Cursor (or copy the `mcpServers` block into `~/.cursor/mcp.json` with an absolute path), ensure the env vars are available to Cursor, then reload MCP.

### 4. Smoke-test

- Bot: call `get_me` on `telegram-bot`
- User: call `auth_status` → `start_login` → `complete_login` → `get_me` on `telegram-user`

## Tools

### `telegram-bot`

| Tool | Purpose |
| --- | --- |
| `get_me` | Verify token / bot username |
| `send_message` | Send text as the bot |
| `get_updates` | Recent inbound updates |
| `list_recent_chats` | Chats derived from updates |

### `telegram-user`

| Tool | Purpose |
| --- | --- |
| `save_api_credentials` | Persist api_id / api_hash locally |
| `auth_status` | Credentials + authorization state |
| `start_login` / `complete_login` | Phone + code (+ optional 2FA) |
| `get_me` | Logged-in user |
| `list_dialogs` / `search_dialogs` | Inbox / dialog search |
| `get_messages` | Recent history |
| `send_message` | Send text as the user |

## Skills

- `telegram-mode-guide` — bot vs user
- `telegram-bot-setup` — BotFather + token
- `telegram-user-setup` — my.telegram.org + login
- `send-telegram-message` — confirm identity/recipient before send

## Layout

```text
.cursor-plugin/plugin.json   # marketplace plugin manifest
mcp.json                     # dual MCP server registration
mcp/                         # TypeScript MCP package
skills/                      # agent skills
assets/logo.svg
```

## Validate

```bash
node scripts/validate-template.mjs
```

## Security notes

- Treat bot tokens, api_hash, and session strings as secrets.
- User session data defaults to `~/.cursor-telegram/` (mode `0700` / files `0600`).
- Prefer confirming every outbound `send_message` in chat.
- Personal-account automation should stay low-volume and personal-use only.
