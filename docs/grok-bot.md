# Grok Bot + Telegram MCP

| Mode | Credentials | Stored on MCP host? |
| --- | --- | --- |
| Cursor stdio | `.env` / process env on **your machine** | Only locally if you choose |
| Single-tenant HTTP | Server env | Yes (your private host) |
| **Open hosted HTTP** | Grok Bot vault headers **every request** | **No — nothing persisted** |

## Open hosted (stateless)

```text
Grok Bot vault  --headers every call-->  MCP  --Telegram API-->  response
                                      (no disk write of tokens)
```

### Operator

```bash
export MCP_OPEN_HOSTED=true
export MCP_CREDENTIALS=header
export MCP_MODE=bot
# leave TELEGRAM_BOT_TOKEN unset
npm run start:http
```

### End user

1. Add `https://YOUR-HOST/mcp/bot`
2. Save securely: header `x-telegram-bot-token`
3. Grok attaches that header on each tool call; MCP uses it for that request only and returns the result

Tools `setup_guide` / `credentials_status` and skill `grok-bot-telegram-setup` teach the Bot this flow.

## Cursor — unchanged

Still uses stdio + `.env`. Unrelated to open hosted.

## Security

- Open host must not log Authorization / `x-telegram-*` header values
- Optional `MCP_AUTH_TOKEN` gateway gate is separate from Telegram tokens
- User-account mode on a stateless host requires `x-telegram-session` from the vault on every call (no server-side session file)
