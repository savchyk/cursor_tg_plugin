import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response, NextFunction } from "express";
import { createBotMcpServer } from "./bot/server.js";
import { createUserMcpServer } from "./user/server.js";

export type HttpMode = "bot" | "user" | "both";

export type HttpOptions = {
  host?: string;
  port?: number;
  mode?: HttpMode;
  /** If set, require Authorization: Bearer <token> (or x-api-key). */
  authToken?: string;
  /** Enable MCP session ids (default false = stateless, better for serverless/Grok). */
  stateful?: boolean;
};

function resolveMode(explicit?: HttpMode): HttpMode {
  if (explicit) return explicit;
  const fromEnv = process.env.MCP_MODE?.trim().toLowerCase();
  if (fromEnv === "bot" || fromEnv === "user" || fromEnv === "both") {
    return fromEnv;
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
 * Endpoints:
 * - GET  /health
 * - POST /mcp          — bot if mode=bot, user if mode=user, bot if mode=both (alias)
 * - POST /mcp/bot      — bot tools (when mode includes bot)
 * - POST /mcp/user     — user tools (when mode includes user)
 */
export async function runHttpServer(opts: HttpOptions = {}) {
  const host = opts.host ?? process.env.HOST?.trim() ?? "0.0.0.0";
  const port = opts.port ?? Number(process.env.PORT ?? 8787);
  const mode = resolveMode(opts.mode);
  const authToken =
    opts.authToken ?? process.env.MCP_AUTH_TOKEN?.trim() ?? undefined;
  const stateful =
    opts.stateful ?? process.env.MCP_STATEFUL?.trim() === "true";

  if (!authToken && process.env.NODE_ENV === "production") {
    console.error(
      "Warning: MCP_AUTH_TOKEN is not set. Anyone who can reach this URL can use your Telegram credentials."
    );
  }

  const app = createMcpExpressApp({ host });

  // Health is unauthenticated for load balancers / uptime checks
  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      mode,
      auth: Boolean(authToken),
      endpoints: {
        ...(mode === "bot" || mode === "both" ? { bot: "/mcp/bot" } : {}),
        ...(mode === "user" || mode === "both" ? { user: "/mcp/user" } : {}),
        default: "/mcp",
      },
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

  // Default /mcp → bot when both, else the single enabled mode
  const defaultFactory =
    mode === "user" ? createUserMcpServer : createBotMcpServer;
  mount("/mcp", botEnabled || userEnabled, defaultFactory);

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, host, () => {
      console.error(
        `[telegram-mcp] HTTP listening on http://${host}:${port} mode=${mode} auth=${Boolean(authToken)}`
      );
      console.error(
        `[telegram-mcp] Grok Bot: add custom MCP URL https://YOUR-PUBLIC-HOST/mcp/bot (or /mcp/user)`
      );
      resolve();
    });
    server.on("error", reject);
  });
}
