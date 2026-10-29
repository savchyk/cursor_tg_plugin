/**
 * Inbound Telegram → (optional) Cursor agent bridge.
 * Dry-run by default: polls getUpdates and logs allowlisted messages.
 *
 * Next step: call @cursor/sdk Agent.prompt when BRIDGE_AUTO_REPLY=true
 * and CURSOR_API_KEY is set.
 */

const API_BASE = "https://api.telegram.org";

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

function parseAllowlist(): Set<string> {
  const raw = env("BRIDGE_CHAT_ALLOWLIST") ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

async function botApi(token: string, method: string, body: Record<string, unknown> = {}) {
  const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; result?: unknown; description?: string };
  if (!data.ok) throw new Error(data.description ?? method);
  return data.result;
}

async function main() {
  const token = env("TELEGRAM_BOT_TOKEN");
  if (!token) {
    console.error("Set TELEGRAM_BOT_TOKEN");
    process.exit(1);
  }

  const allow = parseAllowlist();
  const autoReply = env("BRIDGE_AUTO_REPLY") === "true";
  let offset: number | undefined;

  console.error(
    `[bridge] dry-run=${!autoReply} allowlist=${allow.size ? [...allow].join(",") : "(empty — allow none)"}`
  );

  if (autoReply && !env("CURSOR_API_KEY")) {
    console.error("BRIDGE_AUTO_REPLY=true requires CURSOR_API_KEY (SDK wiring TODO)");
  }

  for (;;) {
    const updates = (await botApi(token, "getUpdates", {
      timeout: 30,
      ...(offset !== undefined ? { offset } : {}),
    })) as Array<{
      update_id: number;
      message?: { message_id: number; chat: { id: number }; text?: string };
    }>;

    for (const u of updates) {
      offset = u.update_id + 1;
      const msg = u.message;
      if (!msg?.text) continue;
      const chatId = String(msg.chat.id);
      if (allow.size > 0 && !allow.has(chatId)) {
        console.error(`[bridge] skip chat ${chatId} (not allowlisted)`);
        continue;
      }
      if (allow.size === 0) {
        console.error(`[bridge] skip chat ${chatId} (empty allowlist)`);
        continue;
      }

      console.log(
        JSON.stringify({
          event: "inbound",
          chat_id: chatId,
          message_id: msg.message_id,
          text: msg.text,
          auto_reply: autoReply,
        })
      );

      if (autoReply) {
        // Placeholder: integrate @cursor/sdk Agent.prompt here, then sendMessage.
        console.error(
          "[bridge] AUTO_REPLY stub — install @cursor/sdk and implement agent invoke"
        );
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
