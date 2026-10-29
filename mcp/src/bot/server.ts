import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  botApi,
  TelegramBotApiError,
  type TelegramUpdate,
  type TelegramUser,
} from "./api.js";

function textResult(text: string, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    ...(isError ? { isError: true } : {}),
  };
}

function formatError(err: unknown): string {
  if (err instanceof TelegramBotApiError) {
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

function chatLabel(chat: {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}): string {
  if (chat.title) return chat.title;
  const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
  if (name) return name;
  if (chat.username) return `@${chat.username}`;
  return String(chat.id);
}

export async function runBotServer() {
  const server = new McpServer({
    name: "telegram-bot",
    version: "0.1.0",
  });

  server.tool(
    "get_me",
    "[Bot API] Verify TELEGRAM_BOT_TOKEN and return the bot identity (id, username).",
    {},
    async () => {
      try {
        const me = await botApi<TelegramUser>("getMe");
        return textResult(JSON.stringify(me, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "send_message",
    "[Bot API] Send a text message as the bot. Prefer chat_id from list_recent_chats or get_updates. Accepts numeric chat_id or public @username.",
    {
      chat_id: z
        .union([z.string(), z.number()])
        .describe("Target chat id (number) or public @username"),
      text: z.string().min(1).describe("Message text to send"),
      parse_mode: z
        .enum(["Markdown", "MarkdownV2", "HTML"])
        .optional()
        .describe("Optional Telegram parse mode"),
      disable_notification: z
        .boolean()
        .optional()
        .describe("Send silently if true"),
    },
    async ({ chat_id, text, parse_mode, disable_notification }) => {
      try {
        const result = await botApi("sendMessage", {
          chat_id,
          text,
          ...(parse_mode ? { parse_mode } : {}),
          ...(disable_notification !== undefined
            ? { disable_notification }
            : {}),
        });
        return textResult(JSON.stringify(result, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "get_updates",
    "[Bot API] Fetch recent inbound updates for the bot (messages the bot can see). Useful for reading chat and finding chat_ids.",
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max updates to return (default 20)"),
      offset: z
        .number()
        .int()
        .optional()
        .describe("Update offset; pass last_update_id+1 to acknowledge"),
      timeout: z
        .number()
        .int()
        .min(0)
        .max(50)
        .optional()
        .describe("Long-poll timeout seconds (default 0)"),
    },
    async ({ limit, offset, timeout }) => {
      try {
        const updates = await botApi<TelegramUpdate[]>("getUpdates", {
          limit: limit ?? 20,
          timeout: timeout ?? 0,
          ...(offset !== undefined ? { offset } : {}),
        });
        return textResult(JSON.stringify(updates, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "list_recent_chats",
    "[Bot API] Best-effort list of recent chats derived from getUpdates. Bots have no full inbox — only chats that recently messaged the bot (or posts it received).",
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max updates to scan (default 50)"),
    },
    async ({ limit }) => {
      try {
        const updates = await botApi<TelegramUpdate[]>("getUpdates", {
          limit: limit ?? 50,
          timeout: 0,
        });
        const byId = new Map<
          number,
          {
            chat_id: number;
            type: string;
            label: string;
            username?: string;
            last_update_id: number;
            last_text?: string;
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
          });
        }

        const chats = [...byId.values()].sort(
          (a, b) => b.last_update_id - a.last_update_id
        );
        return textResult(JSON.stringify({ chats, count: chats.length }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
