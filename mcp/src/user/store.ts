import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

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
  const existing = await readStore();
  await writeStore({
    ...existing,
    apiId,
    apiHash,
  });
}

export async function saveSession(session: string): Promise<void> {
  const existing = await readStore();
  await writeStore({
    ...existing,
    session,
  });
}

export async function resolveCredentials(): Promise<StoredCredentials> {
  const store = await readStore();
  const envId = process.env.TELEGRAM_API_ID?.trim();
  const envHash = process.env.TELEGRAM_API_HASH?.trim();

  const apiId = envId ? Number(envId) : store.apiId;
  const apiHash = envHash || store.apiHash;

  if (!apiId || Number.isNaN(apiId) || !apiHash) {
    throw new Error(
      "Missing Telegram API credentials. Set TELEGRAM_API_ID and TELEGRAM_API_HASH (from https://my.telegram.org) or call save_api_credentials."
    );
  }

  return { apiId, apiHash };
}

export async function resolveSessionString(): Promise<string> {
  const envSession = process.env.TELEGRAM_SESSION?.trim();
  if (envSession) return envSession;
  const store = await readStore();
  return store.session ?? "";
}

export function storeLocation(): string {
  return storePath();
}
