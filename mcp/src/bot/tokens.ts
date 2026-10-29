import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

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

/**
 * Registry of bots from env:
 * - TELEGRAM_BOT_TOKEN → name "default"
 * - TELEGRAM_BOT_<NAME>=token → lowercased name
 * - home bot-token file → "default" if not otherwise set
 */
export async function loadBotRegistry(): Promise<Map<string, string>> {
  const map = new Map<string, string>();

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

  if (!map.has("default")) {
    const home = await readHomeBotToken();
    if (home) map.set("default", home);
  }

  return map;
}

export async function resolveBotToken(bot?: string): Promise<{ name: string; token: string }> {
  const registry = await loadBotRegistry();
  const name = (bot?.trim() || "default").toLowerCase();
  const token = registry.get(name);
  if (!token) {
    const available = [...registry.keys()];
    throw new Error(
      available.length === 0
        ? "No bot token configured. Set TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_<NAME>, or save ~/.cursor-telegram/bot-token."
        : `Unknown bot "${name}". Available: ${available.join(", ")}`
    );
  }
  return { name, token };
}
