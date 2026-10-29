import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  completeLogin,
  getClient,
  getLoginState,
  isAuthorized,
  persistClientSession,
  resolvePeer,
  startLogin,
} from "./client.js";
import {
  readStore,
  resolveCredentials,
  saveCredentials,
  storeLocation,
} from "./store.js";

function textResult(text: string, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    ...(isError ? { isError: true } : {}),
  };
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function entitySummary(entity: {
  id?: unknown;
  className?: string;
  username?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
}) {
  const id = entity.id != null ? String(entity.id) : undefined;
  const name =
    entity.title ||
    [entity.firstName, entity.lastName].filter(Boolean).join(" ") ||
    undefined;
  return {
    id,
    className: entity.className,
    username: entity.username ? `@${entity.username}` : undefined,
    name,
  };
}

export async function runUserServer() {
  const server = new McpServer({
    name: "telegram-user",
    version: "0.1.0",
  });

  server.tool(
    "save_api_credentials",
    "[User account] Store api_id and api_hash from https://my.telegram.org locally (~/.cursor-telegram, mode 0600). Prefer env vars when possible; this avoids putting secrets in chat history repeatedly.",
    {
      api_id: z.number().int().positive().describe("Telegram api_id (number)"),
      api_hash: z.string().min(8).describe("Telegram api_hash (hex string)"),
    },
    async ({ api_id, api_hash }) => {
      try {
        await saveCredentials(api_id, api_hash.trim());
        return textResult(
          `Saved credentials to ${storeLocation()}. Next: start_login with your phone number.`
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "auth_status",
    "[User account] Report whether API credentials exist and whether the MTProto session is authorized.",
    {},
    async () => {
      try {
        const store = await readStore();
        let credentialsOk = false;
        try {
          await resolveCredentials();
          credentialsOk = true;
        } catch {
          credentialsOk = false;
        }
        const authorized = credentialsOk ? await isAuthorized() : false;
        const login = getLoginState();
        return textResult(
          JSON.stringify(
            {
              credentials_present: credentialsOk,
              session_present: Boolean(
                store.session || process.env.TELEGRAM_SESSION?.trim()
              ),
              authorized,
              login_status: login.status,
              store_path: storeLocation(),
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
    "start_login",
    "[User account] Begin phone login for your personal Telegram account. Telegram sends a login code; then call complete_login.",
    {
      phone: z
        .string()
        .min(5)
        .describe("Phone in international format, e.g. +15551234567"),
    },
    async ({ phone }) => {
      try {
        const msg = await startLogin(phone);
        return textResult(msg);
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "complete_login",
    "[User account] Finish login by submitting the Telegram code and optional 2FA password.",
    {
      code: z.string().optional().describe("Login code from Telegram"),
      password: z
        .string()
        .optional()
        .describe("Cloud password if 2FA is enabled"),
    },
    async ({ code, password }) => {
      try {
        const msg = await completeLogin({ code, password });
        return textResult(msg);
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "get_me",
    "[User account] Return the logged-in personal Telegram user (not a bot).",
    {},
    async () => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult(
            "Not authorized. Use start_login / complete_login (or set TELEGRAM_SESSION).",
            true
          );
        }
        const me = await c.getMe();
        await persistClientSession();
        return textResult(JSON.stringify(entitySummary(me as never), null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "list_dialogs",
    "[User account] List recent dialogs (inbox chats) for the logged-in user.",
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe("Max dialogs (default 30)"),
    },
    async ({ limit }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized. Complete login first.", true);
        }
        const dialogs = await c.getDialogs({ limit: limit ?? 30 });
        const rows = dialogs.map((d) => ({
          id: d.id != null ? String(d.id) : undefined,
          title: d.title ?? d.name,
          is_channel: d.isChannel,
          is_group: d.isGroup,
          is_user: d.isUser,
          unread: d.unreadCount,
          entity: d.entity ? entitySummary(d.entity as never) : undefined,
        }));
        return textResult(JSON.stringify({ dialogs: rows }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "search_dialogs",
    "[User account] Filter dialogs by title, username, or id substring.",
    {
      query: z.string().min(1).describe("Case-insensitive search string"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe("Dialogs to scan (default 100)"),
    },
    async ({ query, limit }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized. Complete login first.", true);
        }
        const q = query.toLowerCase();
        const dialogs = await c.getDialogs({ limit: limit ?? 100 });
        const matches = dialogs
          .filter((d) => {
            const title = (d.title ?? d.name ?? "").toLowerCase();
            const id = d.id != null ? String(d.id) : "";
            const username =
              d.entity && "username" in d.entity && d.entity.username
                ? String(d.entity.username).toLowerCase()
                : "";
            return (
              title.includes(q) ||
              id.includes(q) ||
              username.includes(q.replace(/^@/, ""))
            );
          })
          .map((d) => ({
            id: d.id != null ? String(d.id) : undefined,
            title: d.title ?? d.name,
            entity: d.entity ? entitySummary(d.entity as never) : undefined,
          }));
        return textResult(JSON.stringify({ matches }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "get_messages",
    "[User account] Fetch recent message history for a chat (id, @username, me, or dialog title).",
    {
      target: z
        .string()
        .min(1)
        .describe("Chat: me, @username, numeric id, or dialog title"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max messages (default 20)"),
    },
    async ({ target, limit }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized. Complete login first.", true);
        }
        const peer = await resolvePeer(target);
        const messages = await c.getMessages(peer, { limit: limit ?? 20 });
        const rows = messages.map((m) => ({
          id: m.id,
          date: m.date,
          text: m.message || undefined,
          out: m.out,
          sender_id: m.senderId != null ? String(m.senderId) : undefined,
        }));
        return textResult(JSON.stringify({ messages: rows }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "send_message",
    "[User account] Send text as the logged-in personal account. Prefer resolving the peer via list_dialogs or search_dialogs first. Confirm recipient with the user before sending.",
    {
      target: z
        .string()
        .min(1)
        .describe("Recipient: me, @username, numeric id, or dialog title"),
      text: z.string().min(1).describe("Message text"),
    },
    async ({ target, text }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized. Complete login first.", true);
        }
        const peer = await resolvePeer(target);
        const result = await c.sendMessage(peer, { message: text });
        await persistClientSession();
        return textResult(
          JSON.stringify(
            {
              id: result.id,
              date: result.date,
              text: result.message,
              peer: target,
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
