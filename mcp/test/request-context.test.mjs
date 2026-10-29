import test from "node:test";
import assert from "node:assert/strict";
import {
  runWithCredentials,
  getRequestCredentials,
} from "../dist/shared/requestContext.js";
import { resolveBotToken } from "../dist/bot/tokens.js";

test("request credentials override empty env for bot token", async () => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  process.env.MCP_CREDENTIALS = "header";
  await runWithCredentials(
    { botToken: "999:FROM_VAULT" },
    async () => {
      assert.equal(getRequestCredentials().botToken, "999:FROM_VAULT");
      const { token } = await resolveBotToken();
      assert.equal(token, "999:FROM_VAULT");
    }
  );
  delete process.env.MCP_CREDENTIALS;
});
