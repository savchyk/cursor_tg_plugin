# Improvement plans

Execute these **one by one** in order unless a later plan is explicitly needed first.

| # | Plan | Goal |
| --- | --- | --- |
| 01 | [env-wiring](01-env-wiring.md) | Make Bot/user secrets reliably available to Cursor MCP |
| 02 | [npm-publish](02-npm-publish.md) | Publish `cursor-telegram-mcp` and use `npx` in `mcp.json` |
| 03 | [setup-command](03-setup-command.md) | `/telegram-setup` command + setup checklist |
| 04 | [media-tools](04-media-tools.md) | `send_photo` / `send_document` (bot + user) |
| 05 | [message-actions](05-message-actions.md) | Reply, edit, delete, react |
| 06 | [forum-topics](06-forum-topics.md) | List forum topics and send into a topic |
| 07 | [bot-updates](07-bot-updates.md) | Clearer update ack / optional webhook notes |
| 08 | [qr-login](08-qr-login.md) | QR login for `telegram-user` |
| 09 | [send-guardrails](09-send-guardrails.md) | Resolve + confirm peer before every send |
| 10 | [default-identity](10-default-identity.md) | Project rule for default bot vs user |
| 11 | [resources-prompts](11-resources-prompts.md) | MCP resources/prompts (unread, draft reply) |
| 12 | [integration-tests](12-integration-tests.md) | Mocked Bot API + user-client unit tests |
| 13 | [flood-wait](13-flood-wait.md) | FloodWait / rate-limit handling (teleproto) |
| 14 | [ci](14-ci.md) | GitHub Actions: build, smoke, validate |
| 15 | [marketplace](15-marketplace.md) | Cursor Marketplace submission checklist |
| 16 | [inbound-bridge](16-inbound-bridge.md) | Telegram → agent → reply (always-on bridge) |
| 17 | [multi-bot](17-multi-bot.md) | Named multi-bot Bot API support |

**Suggested first three:** `01` → `02` → `03` (usable install path), then pick feature plans (`04`–`11`) or quality (`12`–`14`) as needed.
