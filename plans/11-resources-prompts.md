# 11 — MCP resources & prompts

## Goal

Expose higher-level agent entry points beyond raw tools: unread summary and draft-reply prompts.

## Approach

1. **Prompts** (MCP prompts):
   - `unread-summary` — args: optional limit; instructions to call `list_dialogs` / `get_messages` and summarize
   - `draft-reply` — args: `target`; fetch last messages and draft a reply (do not send until confirmed)
2. **Resources** (optional):
   - `telegram://user/me` — cached get_me JSON
   - `telegram://bot/me` — bot get_me
3. Register in bot and/or user servers via MCP SDK `server.prompt` / `server.resource`.
4. Document in README how to invoke from Cursor.

## Acceptance

- Prompts appear in MCP prompt list for at least `telegram-user`.
- Draft-reply never sends without a separate `send_message` tool call.

## Todos

- [ ] Implement prompts on user (and bot where useful)
- [ ] Optional me resources
- [ ] README
