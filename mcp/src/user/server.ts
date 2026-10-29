import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { formatError, textResult } from "../shared/result.js";
import {
  Api,
  cancelLogin,
  completeLogin,
  completeQrLogin,
  getClient,
  getLoginState,
  isAuthorized,
  listForumTopics,
  persistClientSession,
  resolvePeer,
  resolvePeerCandidates,
  startLogin,
  startQrLogin,
  withUserFlood,
} from "./client.js";
import {
  readStore,
  resolveCredentials,
  saveCredentials,
  storeLocation,
} from "./store.js";

function entitySummary(entity: {
  id?: unknown;
  className?: string;
  username?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  forum?: boolean;
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
    is_forum: Boolean(entity.forum),
  };
}

const waitFlood = z
  .boolean()
  .optional()
  .describe("Auto-wait up to 60s on FloodWait and retry once");

export function createUserMcpServer(): McpServer {
  const server = new McpServer({
    name: "telegram-user",
    version: "0.1.0",
  });

  server.tool(
    "save_api_credentials",
    "[User account] Store api_id and api_hash from https://my.telegram.org under ~/.cursor-telegram (0600).",
    {
      api_id: z.number().int().positive(),
      api_hash: z.string().min(8),
    },
    async ({ api_id, api_hash }) => {
      try {
        await saveCredentials(api_id, api_hash.trim());
        return textResult(
          `Saved credentials to ${storeLocation()}. Next: start_login or start_qr_login.`
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "auth_status",
    "[User account] Credentials + authorization + in-progress login status (includes qr_url when awaiting_qr).",
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
              qr_url: login.qrUrl,
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
    "[User account] Begin phone login. Then complete_login with the code.",
    { phone: z.string().min(5) },
    async ({ phone }) => {
      try {
        return textResult(await startLogin(phone));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "complete_login",
    "[User account] Finish phone login with code and optional 2FA password.",
    {
      code: z.string().optional(),
      password: z.string().optional(),
    },
    async ({ code, password }) => {
      try {
        return textResult(await completeLogin({ code, password }));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "start_qr_login",
    "[User account] Start QR login. Returns tg://login?token=… URL to show/scan (Telegram → Devices → Link Desktop Device).",
    {},
    async () => {
      try {
        return textResult(await startQrLogin());
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "complete_qr_login",
    "[User account] Poll QR login status; pass password if 2FA required after scan.",
    { password: z.string().optional() },
    async ({ password }) => {
      try {
        const login = getLoginState();
        const statusMsg = await completeQrLogin({ password });
        return textResult(
          JSON.stringify(
            {
              message: statusMsg,
              status: getLoginState().status,
              qr_url: login.qrUrl ?? getLoginState().qrUrl,
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
    "cancel_login",
    "[User account] Cancel in-progress phone or QR login.",
    {},
    async () => {
      try {
        return textResult(await cancelLogin());
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "get_me",
    "[User account] Return the logged-in personal Telegram user.",
    {},
    async () => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized. Use start_login or start_qr_login.", true);
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
    "resolve_peer",
    "[User account] Resolve target to id/title for confirmation before send. Errors if title is ambiguous.",
    { target: z.string().min(1) },
    async ({ target }) => {
      try {
        const result = await resolvePeerCandidates(target);
        return textResult(
          JSON.stringify(
            {
              ambiguous: result.ambiguous,
              candidates: result.candidates,
              resolved: !result.ambiguous,
            },
            null,
            2
          ),
          result.ambiguous
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "list_dialogs",
    "[User account] List recent dialogs. Forums marked with is_forum when detectable.",
    {
      limit: z.number().int().min(1).max(200).optional(),
    },
    async ({ limit }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized.", true);
        }
        const dialogs = await withUserFlood(() =>
          c.getDialogs({ limit: limit ?? 30 })
        );
        const rows = dialogs.map((d) => ({
          id: d.id != null ? String(d.id) : undefined,
          title: d.title ?? d.name,
          is_channel: d.isChannel,
          is_group: d.isGroup,
          is_user: d.isUser,
          is_forum: Boolean(
            d.entity && "forum" in d.entity && (d.entity as { forum?: boolean }).forum
          ),
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
      query: z.string().min(1),
      limit: z.number().int().min(1).max(200).optional(),
    },
    async ({ query, limit }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized.", true);
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
            is_forum: Boolean(
              d.entity && "forum" in d.entity && (d.entity as { forum?: boolean }).forum
            ),
            entity: d.entity ? entitySummary(d.entity as never) : undefined,
          }));
        return textResult(JSON.stringify({ matches }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "list_forum_topics",
    "[User account] List topics in a forum group (id, @username, or title).",
    { target: z.string().min(1) },
    async ({ target }) => {
      try {
        const result = await withUserFlood(() => listForumTopics(target));
        const topics =
          result && "topics" in result
            ? (result.topics as Array<{ id?: number; title?: string }>).map((t) => ({
                id: t.id,
                title: t.title,
              }))
            : result;
        return textResult(JSON.stringify({ topics }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "get_messages",
    "[User account] Recent message history for a chat.",
    {
      target: z.string().min(1),
      limit: z.number().int().min(1).max(100).optional(),
    },
    async ({ target, limit }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized.", true);
        }
        const peer = await resolvePeer(target);
        const messages = await withUserFlood(() =>
          c.getMessages(peer, { limit: limit ?? 20 })
        );
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
    "[User account] Send text as the logged-in user. Call resolve_peer first; confirm with user. Prefer numeric id over fuzzy titles.",
    {
      target: z.string().min(1),
      text: z.string().min(1),
      reply_to: z.number().int().optional().describe("Reply-to message id"),
      topic_id: z
        .number()
        .int()
        .optional()
        .describe("Forum topic id (uses replyTo for topic root when needed)"),
      confirm_label: z
        .string()
        .optional()
        .describe("Must match resolved title/username/id or refuse"),
      wait_for_flood: waitFlood,
    },
    async (args) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized.", true);
        }
        const resolved = await resolvePeerCandidates(args.target);
        if (resolved.ambiguous) {
          return textResult(
            `Ambiguous target. Candidates: ${JSON.stringify(resolved.candidates)}`,
            true
          );
        }
        if (args.confirm_label) {
          const want = args.confirm_label.toLowerCase().replace(/^@/, "");
          const ok = resolved.candidates.some((cand) => {
            const title = (cand.title ?? "").toLowerCase();
            const user = (cand.username ?? "").toLowerCase().replace(/^@/, "");
            const id = (cand.id ?? "").toLowerCase();
            return title === want || user === want || id === want || id === args.confirm_label;
          });
          if (!ok) {
            return textResult(
              `confirm_label mismatch. Resolved: ${JSON.stringify(resolved.candidates)}`,
              true
            );
          }
        }
        const peer = resolved.peer!;
        const result = await withUserFlood(
          () =>
            c.sendMessage(peer, {
              message: args.text,
              ...(args.reply_to !== undefined ? { replyTo: args.reply_to } : {}),
              ...(args.topic_id !== undefined && args.reply_to === undefined
                ? { replyTo: args.topic_id }
                : {}),
            }),
          { waitForFlood: args.wait_for_flood }
        );
        await persistClientSession();
        return textResult(
          JSON.stringify(
            {
              id: result.id,
              date: result.date,
              text: result.message,
              peer: args.target,
              resolved: resolved.candidates[0],
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
    "send_photo",
    "[User account] Send a photo from local path or HTTPS URL.",
    {
      target: z.string().min(1),
      file: z.string().min(1).describe("Local path or URL"),
      caption: z.string().optional(),
      reply_to: z.number().int().optional(),
      wait_for_flood: waitFlood,
    },
    async (args) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized.", true);
        }
        const peer = await resolvePeer(args.target);
        const result = await withUserFlood(
          () =>
            c.sendFile(peer, {
              file: args.file,
              caption: args.caption,
              ...(args.reply_to !== undefined ? { replyTo: args.reply_to } : {}),
            }),
          { waitForFlood: args.wait_for_flood }
        );
        await persistClientSession();
        return textResult(
          JSON.stringify({ id: result.id, date: result.date, peer: args.target }, null, 2)
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "send_document",
    "[User account] Send a document/file from local path or HTTPS URL.",
    {
      target: z.string().min(1),
      file: z.string().min(1),
      caption: z.string().optional(),
      reply_to: z.number().int().optional(),
      wait_for_flood: waitFlood,
    },
    async (args) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized.", true);
        }
        const peer = await resolvePeer(args.target);
        const result = await withUserFlood(
          () =>
            c.sendFile(peer, {
              file: args.file,
              caption: args.caption,
              forceDocument: true,
              ...(args.reply_to !== undefined ? { replyTo: args.reply_to } : {}),
            }),
          { waitForFlood: args.wait_for_flood }
        );
        await persistClientSession();
        return textResult(
          JSON.stringify({ id: result.id, date: result.date, peer: args.target }, null, 2)
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "edit_message",
    "[User account] Edit a message you sent.",
    {
      target: z.string().min(1),
      message_id: z.number().int(),
      text: z.string().min(1),
    },
    async ({ target, message_id, text }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized.", true);
        }
        const peer = await resolvePeer(target);
        const result = await withUserFlood(() =>
          c.editMessage(peer, { message: message_id, text })
        );
        return textResult(JSON.stringify({ id: result.id, text: result.message }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "delete_message",
    "[User account] Delete a message. Confirm with the user first — destructive.",
    {
      target: z.string().min(1),
      message_id: z.number().int(),
      revoke: z
        .boolean()
        .optional()
        .describe("Delete for everyone when allowed (default true)"),
    },
    async ({ target, message_id, revoke }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized.", true);
        }
        const peer = await resolvePeer(target);
        await withUserFlood(() =>
          c.deleteMessages(peer, [message_id], { revoke: revoke !== false })
        );
        return textResult(JSON.stringify({ deleted: message_id, peer: target }, null, 2));
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.tool(
    "send_reaction",
    "[User account] Send an emoji reaction to a message.",
    {
      target: z.string().min(1),
      message_id: z.number().int(),
      emoji: z.string().min(1),
    },
    async ({ target, message_id, emoji }) => {
      try {
        const c = await getClient(true);
        if (!(await c.isUserAuthorized())) {
          return textResult("Not authorized.", true);
        }
        const peer = await resolvePeer(target);
        await withUserFlood(() =>
          c.invoke(
            new Api.messages.SendReaction({
              peer: peer as never,
              msgId: message_id,
              reaction: [new Api.ReactionEmoji({ emoticon: emoji })],
            })
          )
        );
        return textResult(
          JSON.stringify({ ok: true, message_id, emoji, peer: target }, null, 2)
        );
      } catch (err) {
        return textResult(formatError(err), true);
      }
    }
  );

  server.prompt(
    "unread-summary",
    "Summarize unread dialogs for the logged-in user",
    { limit: z.string().optional() },
    async ({ limit }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Using telegram-user list_dialogs (limit=${limit ?? "30"}), summarize dialogs with unread>0. Do not send messages.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "draft-reply",
    "Draft a reply to the latest messages in a chat (do not send)",
    { target: z.string() },
    async ({ target }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Using telegram-user get_messages on target "${target}", draft a concise reply. Do NOT call send_message until the user confirms the draft.`,
          },
        },
      ],
    })
  );

  server.resource(
    "user-me",
    "telegram://user/me",
    { description: "Logged-in user identity" },
    async () => {
      const c = await getClient(true);
      if (!(await c.isUserAuthorized())) {
        return {
          contents: [
            {
              uri: "telegram://user/me",
              mimeType: "application/json",
              text: JSON.stringify({ authorized: false }),
            },
          ],
        };
      }
      const me = await c.getMe();
      return {
        contents: [
          {
            uri: "telegram://user/me",
            mimeType: "application/json",
            text: JSON.stringify(entitySummary(me as never), null, 2),
          },
        ],
      };
    }
  );

  return server;
}

export async function runUserServer() {
  const server = createUserMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
