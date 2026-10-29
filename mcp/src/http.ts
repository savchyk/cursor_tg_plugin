import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response, NextFunction } from "express";
import { createBotMcpServer } from "./bot/server.js";
import { credentialsFromRequest } from "./http/credentials.js";
import {
  credentialSource,
  runWithCredentials,
} from "./shared/requestContext.js";
import { createUserMcpServer } from "./user/server.js";

export type HttpMode = "bot" | "user" | "both";

export type HttpOptions = {
  host?: string;
  port?: number;
  mode?: HttpMode;
  /** Optional gateway token. Open hosted often relies on per-user Telegram headers instead. */
  authToken?: string;
  stateful?: boolean;
};

function resolveMode(explicit?: HttpMode): HttpMode {
  if (explicit) return explicit;
  const fromEnv = process.env.MCP_MODE?.trim().toLowerCase();
  if (fromEnv === "bot" || fromEnv === "user" || fromEnv === "both") {
    return fromEnv;
  }
  if (process.env.MCP_OPEN_HOSTED?.trim() === "true") {
    return "both";
  }
  const hasBot = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  const hasUser =
    Boolean(process.env.TELEGRAM_API_ID?.trim()) &&
    Boolean(process.env.TELEGRAM_API_HASH?.trim());
  if (hasBot && hasUser) return "both";
  if (hasBot) return "bot";
  if (hasUser) return "user";
  return "bot";
}

function authMiddleware(token: string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!token) {
      next();
      return;
    }
    const header = req.header("authorization") ?? "";
    const bearer = header.toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : "";
    const apiKey = req.header("x-api-key")?.trim() ?? "";
    if (bearer === token || apiKey === token) {
      next();
      return;
    }
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized" },
      id: null,
    });
  };
}

async function handleMcp(
  req: Request,
  res: Response,
  factory: () => McpServer,
  stateful: boolean
) {
  const creds = await credentialsFromRequest(req);
  await runWithCredentials(creds, async () => {
    const server = factory();
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: stateful ? () => randomUUID() : undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      console.error("MCP request error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });
}

function methodNotAllowed(_req: Request, res: Response) {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
}

/**
 * Host Telegram MCP over Streamable HTTP for Grok Bot / remote clients.
 *
 * Per-user credentials (Grok Bot vault headers on every request — not stored here):
 *   x-telegram-bot-token, x-telegram-api-id, x-telegram-api-hash, x-telegram-session
 */
export async function runHttpServer(opts: HttpOptions = {}) {
  const host = opts.host ?? process.env.HOST?.trim() ?? "0.0.0.0";
  const port = opts.port ?? Number(process.env.PORT ?? 8787);
  const mode = resolveMode(opts.mode);
  const openHosted = process.env.MCP_OPEN_HOSTED?.trim() === "true";
  const authToken =
    opts.authToken ?? process.env.MCP_AUTH_TOKEN?.trim() ?? undefined;
  const stateful =
    opts.stateful ?? process.env.MCP_STATEFUL?.trim() === "true";
  const credsMode = credentialSource();

  if (!authToken && process.env.NODE_ENV === "production" && !openHosted) {
    console.error(
      "Warning: MCP_AUTH_TOKEN is not set. Anyone who can reach this URL can use process env Telegram credentials."
    );
  }
  if (openHosted) {
    console.error(
      "[telegram-mcp] OPEN_HOSTED/stateless: credentials only from request headers; nothing persisted on this host."
    );
  }

  // Public hostnames come from MCP_ALLOWED_HOSTS (set in infra), never hardcoded.
  const allowedHosts = (
    process.env.MCP_ALLOWED_HOSTS?.split(",")
      .map((h) => h.trim())
      .filter(Boolean) ?? []
  );
  if ((host === "0.0.0.0" || host === "::") && allowedHosts.length === 0) {
    allowedHosts.push("localhost", "127.0.0.1");
  }

  const app = createMcpExpressApp({
    host,
    ...(allowedHosts.length ? { allowedHosts } : {}),
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      mode,
      open_hosted: openHosted,
      credentials: credsMode,
      auth: Boolean(authToken),
      endpoints: {
        ...(mode === "bot" || mode === "both" ? { bot: "/mcp/bot" } : {}),
        ...(mode === "user" || mode === "both" ? { user: "/mcp/user" } : {}),
        default: "/mcp",
      },
      vault_headers: {
        bot: ["x-telegram-bot-token"],
        user: [
          "x-telegram-api-id",
          "x-telegram-api-hash",
          "x-telegram-session",
        ],
      },
      stores_credentials: false,
    });
  });

  const requireAuth = authMiddleware(authToken);

  const mount = (
    path: string,
    enabled: boolean,
    factory: () => McpServer
  ) => {
    if (!enabled) {
      app.all(path, (_req, res) => {
        res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: `Endpoint ${path} not enabled (MCP_MODE=${mode})`,
          },
          id: null,
        });
      });
      return;
    }
    app.post(path, requireAuth, (req, res) =>
      handleMcp(req, res, factory, stateful)
    );
    app.get(path, requireAuth, methodNotAllowed);
    app.delete(path, requireAuth, methodNotAllowed);
  };

  const botEnabled = mode === "bot" || mode === "both";
  const userEnabled = mode === "user" || mode === "both";

  mount("/mcp/bot", botEnabled, createBotMcpServer);
  mount("/mcp/user", userEnabled, createUserMcpServer);

  const defaultFactory =
    mode === "user" ? createUserMcpServer : createBotMcpServer;
  mount("/mcp", botEnabled || userEnabled, defaultFactory);

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, host, () => {
      console.error(
        `[telegram-mcp] HTTP on http://${host}:${port} mode=${mode} credentials=${credsMode} open_hosted=${openHosted}`
      );
      console.error(
        `[telegram-mcp] Grok Bot: vault header x-telegram-bot-token on every request (host stores nothing)`
      );
      resolve();
    });
    server.on("error", reject);
  });
}
