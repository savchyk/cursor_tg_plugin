import type { Request } from "express";
import type { RequestCredentials } from "../shared/requestContext.js";

function header(req: Request, name: string): string | undefined {
  const raw = req.header(name);
  return raw?.trim() || undefined;
}

/**
 * Per-request credentials from Grok Bot vault / connector headers.
 * Nothing is written to disk — values exist only for this request.
 *
 *   x-telegram-bot-token
 *   x-telegram-bot-<name>
 *   x-telegram-api-id
 *   x-telegram-api-hash
 *   x-telegram-session
 */
export async function credentialsFromRequest(
  req: Request
): Promise<RequestCredentials> {
  const bots: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const m = /^x-telegram-bot-(.+)$/i.exec(key);
    if (!m || m[1].toLowerCase() === "token") continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (typeof v === "string" && v.trim()) {
      bots[m[1].toLowerCase()] = v.trim();
    }
  }

  const apiIdRaw = header(req, "x-telegram-api-id");
  const apiId = apiIdRaw ? Number(apiIdRaw) : undefined;

  return {
    botToken: header(req, "x-telegram-bot-token"),
    bots: Object.keys(bots).length ? bots : undefined,
    apiId: apiId !== undefined && !Number.isNaN(apiId) ? apiId : undefined,
    apiHash: header(req, "x-telegram-api-hash"),
    session: header(req, "x-telegram-session"),
  };
}
