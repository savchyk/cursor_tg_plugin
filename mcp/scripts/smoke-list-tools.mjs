#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "dist", "cli.js");

async function listTools(mode) {
  const transport = new StdioClientTransport({
    command: "node",
    args: [cli, mode],
    env: {
      ...process.env,
      TELEGRAM_API_ID: process.env.TELEGRAM_API_ID || "1",
      TELEGRAM_API_HASH: process.env.TELEGRAM_API_HASH || "smokehash",
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "0:smoke",
    },
  });
  const client = new Client({ name: "smoke", version: "0.0.0" });
  await client.connect(transport);
  const result = await client.listTools();
  await client.close();
  return result.tools.map((t) => t.name).sort();
}

const expectBot = [
  "acknowledge_updates",
  "delete_message",
  "delete_webhook",
  "edit_message_text",
  "get_me",
  "get_updates",
  "get_webhook_info",
  "list_bots",
  "list_recent_chats",
  "resolve_peer",
  "save_bot_token",
  "send_document",
  "send_message",
  "send_photo",
  "set_message_reaction",
];

const expectUser = [
  "auth_status",
  "cancel_login",
  "complete_login",
  "complete_qr_login",
  "delete_message",
  "edit_message",
  "get_me",
  "get_messages",
  "list_dialogs",
  "list_forum_topics",
  "resolve_peer",
  "save_api_credentials",
  "search_dialogs",
  "send_document",
  "send_message",
  "send_photo",
  "send_reaction",
  "start_login",
  "start_qr_login",
];

test("bot MCP lists expected tools", async () => {
  const botTools = await listTools("bot");
  for (const name of expectBot) {
    assert.ok(botTools.includes(name), `bot missing ${name}`);
  }
});

test("user MCP lists expected tools", async () => {
  const userTools = await listTools("user");
  for (const name of expectUser) {
    assert.ok(userTools.includes(name), `user missing ${name}`);
  }
});
