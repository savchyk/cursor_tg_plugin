#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "dist", "cli.js");
const port = 18787;
const token = "smoke-secret";

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

test("HTTP mode: health + unauthorized + authorized initialize", async () => {
  const child = spawn("node", [cli, "http"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      MCP_MODE: "bot",
      MCP_AUTH_TOKEN: token,
      TELEGRAM_BOT_TOKEN: "0:smoke",
    },
    stdio: ["ignore", "ignore", "pipe"],
  });

  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`);
        if (res.ok) {
          ready = true;
          break;
        }
      } catch {
        // not up yet
      }
      await wait(100);
    }
    assert.ok(ready, "HTTP server did not become ready");

    const health = await (await fetch(`http://127.0.0.1:${port}/health`)).json();
    assert.equal(health.ok, true);
    assert.equal(health.mode, "bot");
    assert.equal(health.auth, true);

    const unauth = await fetch(`http://127.0.0.1:${port}/mcp/bot`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "smoke", version: "0" },
        },
      }),
    });
    assert.equal(unauth.status, 401);

    const auth = await fetch(`http://127.0.0.1:${port}/mcp/bot`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "smoke", version: "0" },
        },
      }),
    });
    assert.ok(auth.status >= 200 && auth.status < 500, `status ${auth.status}`);
    const body = await auth.json();
    assert.equal(body.jsonrpc, "2.0");
    assert.ok(body.result || body.error, "expected MCP JSON-RPC body");
  } finally {
    child.kill("SIGTERM");
    await wait(200);
  }
});
