# Grok Bot + self-host

This plugin supports **two transports**. Cursor keeps using **stdio**. Grok Bot needs **public HTTPS** Streamable HTTP.

| Client | How to run | Config |
| --- | --- | --- |
| **Cursor** (unchanged) | `node mcp/dist/cli.js bot\|user` | [`mcp.json`](../mcp.json) stdio |
| **Grok Bot / remote** | `node mcp/dist/cli.js http` | Public URL + optional `MCP_AUTH_TOKEN` |

Stdio and HTTP share the same tools (`telegram-bot` / `telegram-user`). HTTP does not replace Cursor setup.

## Endpoints

| Path | Purpose |
| --- | --- |
| `GET /health` | Liveness (no auth) |
| `POST /mcp/bot` | Bot API tools |
| `POST /mcp/user` | User-account tools |
| `POST /mcp` | Default: bot (or user if `MCP_MODE=user`) |

## 1. Run locally (then tunnel)

```bash
cd mcp && npm install && npm run build
export TELEGRAM_BOT_TOKEN="…"
export MCP_AUTH_TOKEN="$(openssl rand -hex 24)"
export MCP_MODE=bot   # or user | both
npm run start:http
```

Expose HTTPS (Cloudflare Tunnel, ngrok, Caddy, etc.):

```bash
# example
cloudflared tunnel --url http://127.0.0.1:8787
```

## 2. Docker self-host

```bash
cp .env.example .env
# set TELEGRAM_BOT_TOKEN, MCP_AUTH_TOKEN, MCP_MODE
docker compose up -d --build
```

Put TLS in front (Caddy, Traefik, Cloudflare). Grok Bot requires a **public HTTPS** URL — not `localhost`.

## 3. Connect Grok Bot

In the **Grok Bot** app (chat):

> Add a custom MCP server called telegram-bot at `https://YOUR-HOST/mcp/bot` with bearer token `YOUR_MCP_AUTH_TOKEN`

Or for Grok connectors UI (grok.com/connectors → Custom): paste the same HTTPS URL and auth header/token as the product asks.

Then:

> Using telegram-bot, call `get_me`

For personal account tools, add a second server at `/mcp/user` (with `MCP_MODE=both` or `user`).

## Env reference

| Variable | Required | Notes |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | for bot | Same as Cursor |
| `TELEGRAM_API_ID` / `HASH` | for user | Same as Cursor |
| `MCP_AUTH_TOKEN` | strongly yes | `Authorization: Bearer …` or `x-api-key` |
| `MCP_MODE` | no | `bot` \| `user` \| `both` |
| `PORT` / `HOST` | no | default `8787` / `0.0.0.0` |
| `MCP_STATEFUL` | no | default off (stateless; best for Grok) |

## Security

- Treat the public URL like an API: **always set `MCP_AUTH_TOKEN`** in production.
- Do not commit `.env` or tokens.
- User-mode MTProto on a VPS stores session under `TELEGRAM_USER_DATA_DIR` / `~/.cursor-telegram` — protect that volume.
- Prefer bot mode for notifications; user mode only if you accept account-session risk on the host.

## Cursor users

No change required. Keep using [`mcp.json`](../mcp.json) stdio. Do **not** point Cursor at the HTTP URL unless you intentionally want a remote MCP.
