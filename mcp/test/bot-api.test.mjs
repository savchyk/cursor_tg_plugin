import test from "node:test";
import assert from "node:assert/strict";
import { botApi, TelegramBotApiError } from "../dist/bot/api.js";

test("botApi posts JSON and returns result", async () => {
  process.env.TELEGRAM_BOT_TOKEN = "123:ABC";
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/bot123:ABC\/getMe$/);
    assert.equal(init.method, "POST");
    return {
      json: async () => ({
        ok: true,
        result: { id: 1, is_bot: true, first_name: "T", username: "t_bot" },
      }),
    };
  };
  try {
    const me = await botApi("getMe");
    assert.equal(me.username, "t_bot");
  } finally {
    globalThis.fetch = original;
  }
});

test("botApi throws TelegramBotApiError on ok:false", async () => {
  process.env.TELEGRAM_BOT_TOKEN = "123:ABC";
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    json: async () => ({
      ok: false,
      error_code: 401,
      description: "Unauthorized",
    }),
  });
  try {
    await assert.rejects(() => botApi("getMe"), TelegramBotApiError);
  } finally {
    globalThis.fetch = original;
  }
});

test("botApi attaches flood seconds from parameters.retry_after", async () => {
  process.env.TELEGRAM_BOT_TOKEN = "123:ABC";
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    json: async () => ({
      ok: false,
      error_code: 429,
      description: "Too Many Requests: retry after 3",
      parameters: { retry_after: 3 },
    }),
  });
  try {
    await assert.rejects(
      () => botApi("sendMessage", { chat_id: 1, text: "x" }),
      (err) => err.seconds === 3 || /Flood wait 3/.test(String(err))
    );
  } finally {
    globalThis.fetch = original;
  }
});
