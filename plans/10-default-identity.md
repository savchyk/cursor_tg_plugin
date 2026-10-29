# 10 — Default identity rule

## Goal

Let a project set a default Telegram identity so the agent does not ask “bot or user?” every time.

## Approach

1. Add `rules/telegram-default-identity.mdc` with frontmatter `description` and guidance like:
   - Default to `telegram-bot` for notifications
   - Use `telegram-user` only when user says “my account” / “inbox” / etc.
2. Allow override via a small project file `.cursor/telegram.json` or env `TELEGRAM_DEFAULT_IDENTITY=bot|user` read by skills (document only — MCP need not enforce).
3. Update `telegram-mode-guide` to honor the rule when present.

## Acceptance

- With the rule enabled, agent picks bot for “send me a status ping” without asking.
- Explicit user phrasing still overrides.

## Todos

- [ ] Add rule file
- [ ] Document override in mode-guide + README
- [ ] Validate frontmatter
