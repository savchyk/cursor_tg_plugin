# Improvement plans

Track implementation in [STATUS.md](STATUS.md). Most plans are **done in-repo**; a few still need a human step (npm publish, Marketplace submit, bridge SDK).

| # | Plan | Status | Goal |
| --- | --- | --- | --- |
| 01 | [env-wiring](01-env-wiring.md) | Done | Secrets via `.env` / home store for Cursor MCP |
| 02 | [npm-publish](02-npm-publish.md) | Prep | Publish package; switch default `mcp.json` to `npx` |
| 03 | [setup-command](03-setup-command.md) | Done | `/telegram-setup` checklist command |
| 04 | [media-tools](04-media-tools.md) | Done | Photo/document send (bot + user) |
| 05 | [message-actions](05-message-actions.md) | Done | Reply, edit, delete, react |
| 06 | [forum-topics](06-forum-topics.md) | Done | List topics + send into topic |
| 07 | [bot-updates](07-bot-updates.md) | Done | Ack updates + webhook recovery |
| 08 | [qr-login](08-qr-login.md) | Done | QR login for user account |
| 09 | [send-guardrails](09-send-guardrails.md) | Done | Resolve/confirm peer before send |
| 10 | [default-identity](10-default-identity.md) | Done | Prefer bot unless user asks otherwise |
| 11 | [resources-prompts](11-resources-prompts.md) | Done | Unread + draft-reply prompts/resources |
| 12 | [integration-tests](12-integration-tests.md) | Done | `npm test` offline suite |
| 13 | [flood-wait](13-flood-wait.md) | Done | FloodWait / 429 retry helper |
| 14 | [ci](14-ci.md) | Done | GitHub Actions CI |
| 15 | [marketplace](15-marketplace.md) | Polish | Ready to submit (human) |
| 16 | [inbound-bridge](16-inbound-bridge.md) | Scaffold | Dry-run poller; SDK auto-reply TODO |
| 17 | [multi-bot](17-multi-bot.md) | Done | Named bots via env |

**Still open:** `02` (npm login + publish), `15` (submit), `16` (wire `@cursor/sdk`).
