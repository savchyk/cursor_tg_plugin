---
name: grok-bot-telegram-setup
description: Guide Grok Bot users to save Telegram credentials in Vault as MCP headers for a stateless open hosted Telegram MCP. Use when credentials_status is not ready or the user asks to connect Telegram in Grok Bot.
---

# Grok Bot + Telegram MCP setup (stateless host)

The open hosted MCP **does not store** tokens or sessions. Grok Bot must send vault headers on **every** tool call.

## First steps

1. Call `credentials_status`.
2. If not ready, call `setup_guide`.
3. Ask the user to **Save securely** — never paste secrets into chat.

## BotFather token

| Field | Value |
| --- | --- |
| Header | `x-telegram-bot-token` |
| Value | BotFather token |

Then: `credentials_status` → `get_me`.

> Save your BotFather token securely as header `x-telegram-bot-token`. Use Save securely — don’t paste it into this chat. The MCP server will not keep a copy.

## Personal account

Headers every request: `x-telegram-api-id`, `x-telegram-api-hash`, and `x-telegram-session` (if already logged in). This host does not persist MTProto sessions.

## Do not

- Ask for tokens in plain chat
- Call `save_bot_token` / `save_api_credentials` on open hosted (rejected)
- Expect the server to remember a user between requests without vault headers
