import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request Telegram credentials (HTTP / Grok Bot vault headers).
 * Stdio / Cursor keeps using process.env when this store is empty.
 * Open hosted: never persisted — only lives for the current request.
 */
export type RequestCredentials = {
  botToken?: string;
  /** Named bots: lowercased name → token */
  bots?: Record<string, string>;
  apiId?: number;
  apiHash?: string;
  session?: string;
};

const storage = new AsyncLocalStorage<RequestCredentials>();

export function runWithCredentials<T>(
  creds: RequestCredentials,
  fn: () => T
): T {
  return storage.run(creds, fn);
}

export function getRequestCredentials(): RequestCredentials {
  return storage.getStore() ?? {};
}

export function isStatelessHost(): boolean {
  return (
    process.env.MCP_OPEN_HOSTED?.trim() === "true" ||
    credentialSource() === "header"
  );
}

/** How the process resolves Telegram secrets. */
export type CredentialSource = "env" | "header" | "both";

export function credentialSource(): CredentialSource {
  const v = process.env.MCP_CREDENTIALS?.trim().toLowerCase();
  if (v === "env" || v === "header" || v === "both") return v;
  if (process.env.MCP_OPEN_HOSTED?.trim() === "true") return "header";
  return "both";
}

export function setupGuideText(kind: "bot" | "user"): string {
  if (kind === "bot") {
    return [
      "Telegram Bot credentials are missing for this request.",
      "",
      "=== Grok Bot vault (open hosted — nothing stored on the MCP host) ===",
      "Guide the user — do NOT ask them to paste the token into chat:",
      "1. Confirm this MCP connector URL is added (…/mcp/bot).",
      "2. Ask them to Save securely (secure secret / connector Headers):",
      "   Header name:  x-telegram-bot-token",
      "   Value:        their BotFather token",
      "3. Grok will send that header on every tool call. This server does not save it.",
      "4. Call credentials_status, then get_me.",
      "",
      "Say: “Save your BotFather token securely as header x-telegram-bot-token —",
      "use Save securely, don’t paste it here.”",
      "",
      "=== Cursor / single-tenant self-host ===",
      "Set TELEGRAM_BOT_TOKEN in .env (only on that private machine).",
      "",
      "Never put raw tokens in the chat transcript.",
    ].join("\n");
  }
  return [
    "Telegram user-account credentials are missing for this request.",
    "",
    "=== Grok Bot vault (stateless host — nothing stored here) ===",
    "Save securely as headers (sent every request, not saved on MCP):",
    "1. x-telegram-api-id",
    "2. x-telegram-api-hash",
    "3. x-telegram-session  (StringSession after you login elsewhere or via a flow that returns it once for vault save)",
    "",
    "This open host does not keep sessions on disk. Every call must include the headers.",
    "",
    "=== Cursor / single-tenant self-host ===",
    "TELEGRAM_API_ID + TELEGRAM_API_HASH (+ TELEGRAM_SESSION) in env on that machine only.",
  ].join("\n");
}
