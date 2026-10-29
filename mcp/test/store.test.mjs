import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  saveCredentials,
  readStore,
  saveSession,
  resolveCredentials,
  resolveSessionString,
} from "../dist/user/store.js";

test("store saves credentials and session in TELEGRAM_USER_DATA_DIR", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tg-store-"));
  process.env.TELEGRAM_USER_DATA_DIR = dir;
  delete process.env.TELEGRAM_API_ID;
  delete process.env.TELEGRAM_API_HASH;
  delete process.env.TELEGRAM_SESSION;

  await saveCredentials(42, "hashhashhash");
  await saveSession("session-string");

  const store = await readStore();
  assert.equal(store.apiId, 42);
  assert.equal(store.apiHash, "hashhashhash");
  assert.equal(store.session, "session-string");

  const creds = await resolveCredentials();
  assert.equal(creds.apiId, 42);
  assert.equal(await resolveSessionString(), "session-string");
});
