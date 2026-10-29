# cursor-telegram-mcp

MCP servers for Telegram (Bot API + personal account).

## Transports

| Command | Transport | Clients |
| --- | --- | --- |
| `cursor-telegram-mcp bot` | stdio | Cursor |
| `cursor-telegram-mcp user` | stdio | Cursor |
| `cursor-telegram-mcp http` | Streamable HTTP | Grok Bot, self-host |

```bash
npx cursor-telegram-mcp bot
npx cursor-telegram-mcp user
MCP_AUTH_TOKEN=… MCP_MODE=bot npx cursor-telegram-mcp http
```

Repo docs: Cursor setup in the root README; Grok Bot / Docker in `docs/grok-bot.md`.
