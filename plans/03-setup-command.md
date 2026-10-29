# 03 — Setup command / checklist

## Goal

Add a Cursor command that walks the user through bot and/or user-account setup and smoke tests.

## Approach

1. Add `commands/telegram-setup.md` with frontmatter `name` + `description`.
2. Command body should instruct the agent to:
   - Ask which mode(s): bot, user, or both
   - Follow existing skills (`telegram-bot-setup`, `telegram-user-setup`)
   - Call `get_me` / `auth_status` and report pass/fail
   - Stop before any `send_message` unless user asks
3. Optionally add `agents/telegram-setup.md` for a dedicated setup agent.
4. Link from README “Quick start”.

## Acceptance

- Invoking the command produces a clear checklist and uses MCP tools for verification.
- No automatic outbound messages during setup.

## Todos

- [ ] `commands/telegram-setup.md`
- [ ] Optional setup agent
- [ ] README link
- [ ] Validate frontmatter via `scripts/validate-template.mjs`
