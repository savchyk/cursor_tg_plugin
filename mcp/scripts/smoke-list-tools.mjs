#!/usr/bin/env node
/**
 * Smoke: spawn bot + user MCP servers and list tools over stdio.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "dist", "cli.js");

async function listTools(mode) {
  const transport = new StdioClientTransport({
    command: "node",
    args: [cli, mode],
    env: {
      ...process.env,
      // Dummy values so user server can boot tools without real Telegram
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

const botTools = await listTools("bot");
const userTools = await listTools("user");

console.log("bot tools:", botTools.join(", "));
console.log("user tools:", userTools.join(", "));

const expectBot = ["get_me", "get_updates", "list_recent_chats", "send_message"];
const expectUser = [
  "auth_status",
  "complete_login",
  "get_me",
  "get_messages",
  "list_dialogs",
  "save_api_credentials",
  "search_dialogs",
  "send_message",
  "start_login",
];

function assertIncludes(actual, expected, label) {
  for (const name of expected) {
    if (!actual.includes(name)) {
      throw new Error(`${label} missing tool: ${name}`);
    }
  }
}

assertIncludes(botTools, expectBot, "bot");
assertIncludes(userTools, expectUser, "user");
console.log("Smoke list-tools passed.");
