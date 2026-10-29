import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  credentialSource,
  getRequestCredentials,
  setupGuideText,
} from "../shared/requestContext.js";

function dataDir(): string {
  return (
    process.env.TELEGRAM_USER_DATA_DIR?.trim() ||
    path.join(os.homedir(), ".cursor-telegram")
  );
}

export function botTokenFilePath(): string {
  return path.join(dataDir(), "bot-token");
}

/** Load default token from ~/.cursor-telegram/bot-token if present. */
export async function readHomeBotToken(): Promise<string | undefined> {
  try {
    const raw = await fs.readFile(botTokenFilePath(), "utf8");
    const token = raw.trim();
    return token || undefined;
  } catch {
    return undefined;
  }
}

export async function writeHomeBotToken(token: string): Promise<string> {
  const src = credentialSource();
  if (src === "header" || process.env.MCP_OPEN_HOSTED?.trim() === "true") {
    throw new Error(
      "This MCP host is stateless and does not store tokens. " +
        "Keep the BotFather token in Grok Bot vault as header x-telegram-bot-token (sent every request)."
    );
  }
  const dir = dataDir();
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  try {
    await fs.chmod(dir, 0o700);
  } catch {
    // ignore
  }
  const file = botTokenFilePath();
  await fs.writeFile(file, `${token.trim()}\n`, { mode: 0o600 });
  try {
    await fs.chmod(file, 0o600);
  } catch {
    // ignore
  }
  return file;
}

function mergeRegistryFromEnv(map: Map<string, string>): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (!value?.trim()) continue;
    if (key === "TELEGRAM_BOT_TOKEN") {
      map.set("default", value.trim());
      continue;
    }
    const m = /^TELEGRAM_BOT_([A-Za-z0-9]+)$/.exec(key);
    if (m) {
      map.set(m[1].toLowerCase(), value.trim());
    }
  }
}

function mergeRegistryFromRequest(map: Map<string, string>): void {
  const ctx = getRequestCredentials();
  if (ctx.botToken?.trim()) {
    map.set("default", ctx.botToken.trim());
  }
  if (ctx.bots) {
    for (const [name, token] of Object.entries(ctx.bots)) {
      if (token?.trim()) map.set(name.toLowerCase(), token.trim());
    }
  }
}

/**
 * Registry of bots:
 * - Request headers / Grok Bot vault (per-user) when MCP_CREDENTIALS includes header
 * - Env TELEGRAM_BOT_TOKEN / TELEGRAM_BOT_<NAME> when MCP_CREDENTIALS includes env
 * - home bot-token file (env mode only)
 */
export async function loadBotRegistry(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const src = credentialSource();

  if (src === "header" || src === "both") {
    mergeRegistryFromRequest(map);
  }
  if (src === "env" || src === "both") {
    mergeRegistryFromEnv(map);
    if (!map.has("default")) {
      const home = await readHomeBotToken();
      if (home) map.set("default", home);
    }
  }

  return map;
}

export async function resolveBotToken(
  bot?: string
): Promise<{ name: string; token: string }> {
  const registry = await loadBotRegistry();
  const name = (bot?.trim() || "default").toLowerCase();
  const token = registry.get(name);
  if (!token) {
    const available = [...registry.keys()];
    if (available.length === 0) {
      throw new Error(setupGuideText("bot"));
    }
    throw new Error(
      `Unknown bot "${name}". Available: ${available.join(", ")}`
    );
  }
  return { name, token };
}

export function botCredentialsStatus(): {
  source: string;
  bots_configured: string[];
  from_request: boolean;
  from_env_hint: boolean;
} {
  const ctx = getRequestCredentials();
  const fromRequest = Boolean(
    ctx.botToken?.trim() ||
      (ctx.bots && Object.keys(ctx.bots).length > 0)
  );
  const fromEnv = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  return {
    source: credentialSource(),
    bots_configured: [], // filled async by caller via loadBotRegistry
    from_request: fromRequest,
    from_env_hint: fromEnv,
  };
}
