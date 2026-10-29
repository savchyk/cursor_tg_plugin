# Inbound bridge (scaffold)

Long-running worker that can turn inbound Telegram messages into Cursor agent runs.

This is **not** part of the MCP stdio servers. It needs:

- `CURSOR_API_KEY`
- Telegram bot token (recommended) or user session
- Allowlisted chat ids
- Optional `BRIDGE_AUTO_REPLY=true` (default dry-run)

## Status

v0 scaffold only — see [`src/index.ts`](src/index.ts). Wire `@cursor/sdk` when you are ready to run live agent jobs.

## Run (dry-run poll)

```bash
cd bridge
cp ../.env.example ../.env   # or export env
npm install
npm run build
npm start
```

## Safety

- Default: log inbound updates; do not reply.
- Always allowlist chat ids.
- Personal MTProto automation can violate Telegram ToS if abused.
