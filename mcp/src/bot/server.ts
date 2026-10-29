import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { formatError, textResult } from "../shared/result.js";
import {
  botApi,
  chatLabel,
  type TelegramChat,
  type TelegramUpdate,
  type TelegramUser,
} from "./api.js";
import { loadBotRegistry, writeHomeBotToken } from "./tokens.js";

const botName = z
  .string()
  .optional()
  .describe('Bot name from TELEGRAM_BOT_<NAME> (default: "default")');

const waitFlood = z
  .boolean()
  .optional()
  .describe("If true, auto-wait up to 60s on FloodWait/429 and retry once");

function nextOffset(updates: TelegramUpdate[]): number | undefined {
  if (updates.length === 0) return undefined;
  return Math.max(...updates.map((u) => u.update_id)) + 1;
}

export async function runBotServer() {
  const server = new McpServer({
    name: "telegram-bot",
    version: "0.1.0",
  });

  server.tool(
    "list_bots",
    "[Bot API] List configured bot names (tokens masked) and optionally call getMe for each.",
    {
      probe: z
        .boolean()
        .optional()
        .describe("If true, call getMe for each bot (default true)"),
    },
    async ({ probe }) => {
      try {
        const registry = await loadBotRegistry();
        const doProbe = probe !== false;
        const bots = [];
        for (const [name, token] of registry) {
          const masked =
            token.length > 10
              ? `${token.slice(0, 4)}…${token.slice(-4)}`
              : "(set)";
          let me: TelegramUser | undefined;
          let error: string | undefined;
          if (doProbe) {
            try {
              me = await botApi<TelegramUser>("getMe", {}, { bot: name });
            } catch (err) {
              error = formatError(err);
            }
          }
          bots.push({ name, token_masked: masked, me, error });
        }
        return textResult(JSON.stringify({ bots, count: bots.length }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "save_bot_token",
    "[Bot API] Save default bot token to ~/.cursor-telegram/bot-token (mode 0600).",
    {
      token: z.string().min(10).describe("BotFather token"),
    },
    async ({ token }) => {
      try {
        const path = await writeHomeBotToken(token);
        return textResult(`Saved default bot token to ${path}`);
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "get_me",
    "[Bot API] Verify bot token and return bot identity (id, username).",
    { bot: botName },
    async ({ bot }) => {
      try {
        const me = await botApi<TelegramUser>("getMe", {}, { bot });
        return textResult(JSON.stringify(me, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "resolve_peer",
    "[Bot API] Resolve a chat via getChat and return id/title/username for confirmation before send.",
    {
      chat_id: z
        .union([z.string(), z.number()])
        .describe("chat_id or @username"),
      bot: botName,
    },
    async ({ chat_id, bot }) => {
      try {
        const chat = await botApi<TelegramChat>(
          "getChat",
          { chat_id },
          { bot }
        );
        return textResult(
          JSON.stringify(
            {
              chat_id: chat.id,
              type: chat.type,
              label: chatLabel(chat),
              username: chat.username ? `@${chat.username}` : undefined,
              is_forum: chat.is_forum,
            },
            null,
            2
          )
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "send_message",
    "[Bot API] Send a text message as the bot. Confirm recipient with resolve_peer first. Accepts chat_id or @username.",
    {
      chat_id: z.union([z.string(), z.number()]),
      text: z.string().min(1),
      parse_mode: z.enum(["Markdown", "MarkdownV2", "HTML"]).optional(),
      disable_notification: z.boolean().optional(),
      reply_to_message_id: z.number().int().optional(),
      message_thread_id: z
        .number()
        .int()
        .optional()
        .describe("Forum topic thread id"),
      confirm_label: z
        .string()
        .optional()
        .describe("If set, must match chat title/username/label or send is refused"),
      bot: botName,
      wait_for_flood: waitFlood,
    },
    async (args) => {
      try {
        if (args.confirm_label) {
          const chat = await botApi<TelegramChat>(
            "getChat",
            { chat_id: args.chat_id },
            { bot: args.bot }
          );
          const label = chatLabel(chat).toLowerCase();
          const want = args.confirm_label.toLowerCase().replace(/^@/, "");
          const username = (chat.username ?? "").toLowerCase();
          if (
            label !== want &&
            username !== want &&
            `@${username}` !== args.confirm_label.toLowerCase() &&
            String(chat.id) !== args.confirm_label
          ) {
            return textResult(
              `confirm_label mismatch. Resolved label="${chatLabel(chat)}" id=${chat.id} username=${chat.username ?? ""}.`,
              true
            );
          }
        }
        const result = await botApi(
          "sendMessage",
          {
            chat_id: args.chat_id,
            text: args.text,
            ...(args.parse_mode ? { parse_mode: args.parse_mode } : {}),
            ...(args.disable_notification !== undefined
              ? { disable_notification: args.disable_notification }
              : {}),
            ...(args.reply_to_message_id !== undefined
              ? { reply_to_message_id: args.reply_to_message_id }
              : {}),
            ...(args.message_thread_id !== undefined
              ? { message_thread_id: args.message_thread_id }
              : {}),
          },
          { bot: args.bot, waitForFlood: args.wait_for_flood }
        );
        return textResult(JSON.stringify(result, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "send_photo",
    "[Bot API] Send a photo by HTTPS URL or file_id.",
    {
      chat_id: z.union([z.string(), z.number()]),
      photo: z.string().min(1).describe("HTTPS URL or file_id"),
      caption: z.string().optional(),
      parse_mode: z.enum(["Markdown", "MarkdownV2", "HTML"]).optional(),
      reply_to_message_id: z.number().int().optional(),
      message_thread_id: z.number().int().optional(),
      bot: botName,
      wait_for_flood: waitFlood,
    },
    async (args) => {
      try {
        const result = await botApi(
          "sendPhoto",
          {
            chat_id: args.chat_id,
            photo: args.photo,
            ...(args.caption ? { caption: args.caption } : {}),
            ...(args.parse_mode ? { parse_mode: args.parse_mode } : {}),
            ...(args.reply_to_message_id !== undefined
              ? { reply_to_message_id: args.reply_to_message_id }
              : {}),
            ...(args.message_thread_id !== undefined
              ? { message_thread_id: args.message_thread_id }
              : {}),
          },
          { bot: args.bot, waitForFlood: args.wait_for_flood }
        );
        return textResult(JSON.stringify(result, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "send_document",
    "[Bot API] Send a document by HTTPS URL or file_id.",
    {
      chat_id: z.union([z.string(), z.number()]),
      document: z.string().min(1),
      caption: z.string().optional(),
      parse_mode: z.enum(["Markdown", "MarkdownV2", "HTML"]).optional(),
      reply_to_message_id: z.number().int().optional(),
      message_thread_id: z.number().int().optional(),
      bot: botName,
      wait_for_flood: waitFlood,
    },
    async (args) => {
      try {
        const result = await botApi(
          "sendDocument",
          {
            chat_id: args.chat_id,
            document: args.document,
            ...(args.caption ? { caption: args.caption } : {}),
            ...(args.parse_mode ? { parse_mode: args.parse_mode } : {}),
            ...(args.reply_to_message_id !== undefined
              ? { reply_to_message_id: args.reply_to_message_id }
              : {}),
            ...(args.message_thread_id !== undefined
              ? { message_thread_id: args.message_thread_id }
              : {}),
          },
          { bot: args.bot, waitForFlood: args.wait_for_flood }
        );
        return textResult(JSON.stringify(result, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "edit_message_text",
    "[Bot API] Edit text of a message the bot sent.",
    {
      chat_id: z.union([z.string(), z.number()]),
      message_id: z.number().int(),
      text: z.string().min(1),
      parse_mode: z.enum(["Markdown", "MarkdownV2", "HTML"]).optional(),
      bot: botName,
    },
    async (args) => {
      try {
        const result = await botApi(
          "editMessageText",
          {
            chat_id: args.chat_id,
            message_id: args.message_id,
            text: args.text,
            ...(args.parse_mode ? { parse_mode: args.parse_mode } : {}),
          },
          { bot: args.bot }
        );
        return textResult(JSON.stringify(result, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "delete_message",
    "[Bot API] Delete a message. Confirm with the user first — destructive.",
    {
      chat_id: z.union([z.string(), z.number()]),
      message_id: z.number().int(),
      bot: botName,
    },
    async (args) => {
      try {
        const result = await botApi(
          "deleteMessage",
          { chat_id: args.chat_id, message_id: args.message_id },
          { bot: args.bot }
        );
        return textResult(JSON.stringify({ ok: result }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "set_message_reaction",
    "[Bot API] Set emoji reaction on a message.",
    {
      chat_id: z.union([z.string(), z.number()]),
      message_id: z.number().int(),
      emoji: z.string().min(1).describe('Emoji e.g. "👍"'),
      bot: botName,
    },
    async (args) => {
      try {
        const result = await botApi(
          "setMessageReaction",
          {
            chat_id: args.chat_id,
            message_id: args.message_id,
            reaction: [{ type: "emoji", emoji: args.emoji }],
          },
          { bot: args.bot }
        );
        return textResult(JSON.stringify({ ok: result }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "get_updates",
    "[Bot API] Fetch recent inbound updates. Returns next_offset for acknowledging.",
    {
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().optional(),
      timeout: z.number().int().min(0).max(50).optional(),
      bot: botName,
    },
    async ({ limit, offset, timeout, bot }) => {
      try {
        const updates = await botApi<TelegramUpdate[]>(
          "getUpdates",
          {
            limit: limit ?? 20,
            timeout: timeout ?? 0,
            ...(offset !== undefined ? { offset } : {}),
          },
          { bot }
        );
        return textResult(
          JSON.stringify(
            { updates, next_offset: nextOffset(updates), count: updates.length },
            null,
            2
          )
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "acknowledge_updates",
    "[Bot API] Drop pending updates by confirming offset (last_update_id+1), or drop_pending via deleteWebhook-style flush.",
    {
      offset: z
        .number()
        .int()
        .optional()
        .describe("Confirm updates with update_id < offset"),
      drop_pending: z
        .boolean()
        .optional()
        .describe("If true, call getUpdates with offset=-1 briefly to skip backlog"),
      bot: botName,
    },
    async ({ offset, drop_pending, bot }) => {
      try {
        if (drop_pending) {
          const updates = await botApi<TelegramUpdate[]>(
            "getUpdates",
            { offset: -1, limit: 1, timeout: 0 },
            { bot }
          );
          const next = nextOffset(updates);
          if (next) {
            await botApi("getUpdates", { offset: next, limit: 1, timeout: 0 }, { bot });
          }
          return textResult(
            JSON.stringify({ dropped_via: "offset=-1", next_offset: next }, null, 2)
          );
        }
        if (offset === undefined) {
          return textResult("Provide offset (last_update_id+1) or drop_pending=true", true);
        }
        const updates = await botApi<TelegramUpdate[]>(
          "getUpdates",
          { offset, limit: 1, timeout: 0 },
          { bot }
        );
        return textResult(
          JSON.stringify(
            { acknowledged_offset: offset, next_offset: nextOffset(updates) ?? offset },
            null,
            2
          )
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "list_recent_chats",
    "[Bot API] Best-effort recent chats from getUpdates. Includes next_offset.",
    {
      limit: z.number().int().min(1).max(100).optional(),
      bot: botName,
    },
    async ({ limit, bot }) => {
      try {
        const updates = await botApi<TelegramUpdate[]>(
          "getUpdates",
          { limit: limit ?? 50, timeout: 0 },
          { bot }
        );
        const byId = new Map<
          number,
          {
            chat_id: number;
            type: string;
            label: string;
            username?: string;
            last_update_id: number;
            last_text?: string;
            message_thread_id?: number;
          }
        >();

        for (const update of updates) {
          const msg =
            update.message ??
            update.edited_message ??
            update.channel_post ??
            update.edited_channel_post;
          if (!msg?.chat) continue;
          const chat = msg.chat;
          byId.set(chat.id, {
            chat_id: chat.id,
            type: chat.type,
            label: chatLabel(chat),
            username: chat.username,
            last_update_id: update.update_id,
            last_text: msg.text,
            message_thread_id: msg.message_thread_id,
          });
        }

        const chats = [...byId.values()].sort(
          (a, b) => b.last_update_id - a.last_update_id
        );
        return textResult(
          JSON.stringify(
            { chats, count: chats.length, next_offset: nextOffset(updates) },
            null,
            2
          )
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "get_webhook_info",
    "[Bot API] Show webhook status. If a webhook is set, getUpdates will fail until delete_webhook.",
    { bot: botName },
    async ({ bot }) => {
      try {
        const info = await botApi("getWebhookInfo", {}, { bot });
        return textResult(JSON.stringify(info, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "delete_webhook",
    "[Bot API] Remove webhook so getUpdates polling works again.",
    {
      drop_pending_updates: z.boolean().optional(),
      bot: botName,
    },
    async ({ drop_pending_updates, bot }) => {
      try {
        const ok = await botApi(
          "deleteWebhook",
          {
            drop_pending_updates: drop_pending_updates ?? false,
          },
          { bot }
        );
        return textResult(JSON.stringify({ ok }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.prompt(
    "unread-summary",
    "Summarize recent inbound bot updates / chats",
    { limit: z.string().optional() },
    async ({ limit }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Using telegram-bot tools, call list_recent_chats (limit=${limit ?? "50"}) and get_updates, then summarize who messaged and what they said. Do not send messages.`,
          },
        },
      ],
    })
  );

  server.resource(
    "bot-me",
    "telegram://bot/me",
    { description: "Current default bot identity (getMe)" },
    async () => {
      const me = await botApi<TelegramUser>("getMe", {}, {});
      return {
        contents: [
          {
            uri: "telegram://bot/me",
            mimeType: "application/json",
            text: JSON.stringify(me, null, 2),
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
