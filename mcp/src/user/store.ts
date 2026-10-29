import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  credentialSource,
  getRequestCredentials,
  setupGuideText,
} from "../shared/requestContext.js";

export type StoredCredentials = {
  apiId: number;
  apiHash: string;
};

export type StoreData = {
  apiId?: number;
  apiHash?: string;
  session?: string;
};

function dataDir(): string {
  return (
    process.env.TELEGRAM_USER_DATA_DIR?.trim() ||
    path.join(os.homedir(), ".cursor-telegram")
  );
}

function storePath(): string {
  return path.join(dataDir(), "user-store.json");
}

async function ensureDir(): Promise<void> {
  const dir = dataDir();
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  try {
    await fs.chmod(dir, 0o700);
  } catch {
    // best-effort on platforms without chmod semantics
  }
}

export async function readStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    return JSON.parse(raw) as StoreData;
  } catch {
    return {};
  }
}

export async function writeStore(data: StoreData): Promise<void> {
  await ensureDir();
  const file = storePath();
  await fs.writeFile(file, JSON.stringify(data, null, 2), { mode: 0o600 });
  try {
    await fs.chmod(file, 0o600);
  } catch {
    // best-effort
  }
}

export async function saveCredentials(
  apiId: number,
  apiHash: string
): Promise<void> {
  const src = credentialSource();
  if (src === "header" || process.env.MCP_OPEN_HOSTED?.trim() === "true") {
    throw new Error(
      "This MCP host is stateless: it does not store credentials. " +
        "Save x-telegram-api-id and x-telegram-api-hash in Grok Bot vault (headers sent every request)."
    );
  }
  const existing = await readStore();
  await writeStore({
    ...existing,
    apiId,
    apiHash,
  });
}

export async function saveSession(session: string): Promise<void> {
  const src = credentialSource();
  if (src === "header" || process.env.MCP_OPEN_HOSTED?.trim() === "true") {
    // Stateless: do not write session (or anything) on the host.
    void session;
    return;
  }
  const existing = await readStore();
  await writeStore({
    ...existing,
    session,
  });
}

export async function resolveCredentials(): Promise<StoredCredentials> {
  const src = credentialSource();
  const ctx = getRequestCredentials();
  const store = src === "header" ? {} : await readStore();

  let apiId: number | undefined;
  let apiHash: string | undefined;

  if (src === "header" || src === "both") {
    if (ctx.apiId && ctx.apiHash) {
      apiId = ctx.apiId;
      apiHash = ctx.apiHash;
    }
  }
  if ((src === "env" || src === "both") && (!apiId || !apiHash)) {
    const envId = process.env.TELEGRAM_API_ID?.trim();
    const envHash = process.env.TELEGRAM_API_HASH?.trim();
    apiId = envId ? Number(envId) : store.apiId;
    apiHash = envHash || store.apiHash;
  }

  if (!apiId || Number.isNaN(apiId) || !apiHash) {
    throw new Error(setupGuideText("user"));
  }

  return { apiId, apiHash };
}

export async function resolveSessionString(): Promise<string> {
  const src = credentialSource();
  const ctx = getRequestCredentials();
  if ((src === "header" || src === "both") && ctx.session?.trim()) {
    return ctx.session.trim();
  }
  if (src === "header") {
    return "";
  }
  const envSession = process.env.TELEGRAM_SESSION?.trim();
  if (envSession) return envSession;
  const store = await readStore();
  return store.session ?? "";
}

export function storeLocation(): string {
  return storePath();
}
