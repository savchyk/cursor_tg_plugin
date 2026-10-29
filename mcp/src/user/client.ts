import { TelegramClient, Api } from "teleproto";
import { StringSession } from "teleproto/sessions";
import {
  resolveCredentials,
  resolveSessionString,
  saveSession,
} from "./store.js";

export type LoginState = {
  status: "idle" | "awaiting_code" | "awaiting_password" | "completed" | "failed";
  phone?: string;
  error?: string;
  phoneCodeResolve?: (code: string) => void;
  passwordResolve?: (password: string) => void;
  done?: Promise<void>;
};

let client: TelegramClient | null = null;
let loginState: LoginState = { status: "idle" };

export function getLoginState(): LoginState {
  return loginState;
}

export async function getClient(connect = true): Promise<TelegramClient> {
  if (client) {
    if (connect && !client.connected) {
      await client.connect();
    }
    return client;
  }

  const { apiId, apiHash } = await resolveCredentials();
  const session = new StringSession(await resolveSessionString());
  client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  if (connect) {
    await client.connect();
  }
  return client;
}

export async function persistClientSession(): Promise<void> {
  if (!client) return;
  const saved = client.session.save() as unknown as string;
  if (saved) await saveSession(saved);
}

export async function isAuthorized(): Promise<boolean> {
  try {
    const c = await getClient(true);
    return await c.isUserAuthorized();
  } catch {
    return false;
  }
}

export async function startLogin(phone: string): Promise<string> {
  if (loginState.status === "awaiting_code" || loginState.status === "awaiting_password") {
    return `Login already in progress (${loginState.status}). Call complete_login with the code (and password if needed).`;
  }

  const normalized = phone.trim();
  loginState = { status: "awaiting_code", phone: normalized };

  const c = await getClient(true);

  loginState.done = c
    .start({
      phoneNumber: async () => normalized,
      phoneCode: async () =>
        new Promise<string>((resolve) => {
          loginState.status = "awaiting_code";
          loginState.phoneCodeResolve = resolve;
        }),
      password: async () =>
        new Promise<string>((resolve) => {
          loginState.status = "awaiting_password";
          loginState.passwordResolve = resolve;
        }),
      onError: (err) => {
        loginState.status = "failed";
        loginState.error = err instanceof Error ? err.message : String(err);
      },
    })
    .then(async () => {
      await persistClientSession();
      loginState = { status: "completed", phone: normalized };
    })
    .catch((err) => {
      loginState = {
        status: "failed",
        phone: normalized,
        error: err instanceof Error ? err.message : String(err),
      };
    });

  // Give sendCode a moment to fire before returning
  await new Promise((r) => setTimeout(r, 800));

  if (loginState.status === "failed") {
    return `Login failed: ${loginState.error ?? "unknown error"}`;
  }

  return `Login started for ${normalized}. Telegram should send a code. Call complete_login with { code }. If 2FA is enabled, include password as well (or call complete_login again when status is awaiting_password).`;
}

export async function completeLogin(params: {
  code?: string;
  password?: string;
}): Promise<string> {
  const initial = loginState.status;
  if (initial === "idle" || initial === "completed") {
    return "No login in progress. Call start_login first.";
  }
  if (initial === "failed") {
    return `Previous login failed: ${loginState.error ?? "unknown"}. Call start_login again.`;
  }

  if (initial === "awaiting_code") {
    if (!params.code?.trim()) {
      return "Status is awaiting_code. Provide code from Telegram.";
    }
    const resolve = loginState.phoneCodeResolve;
    if (!resolve) {
      return "Login not ready yet; wait a second and retry complete_login with the same code.";
    }
    resolve(params.code.trim());
  }

  const needsPassword =
    Boolean(params.password?.trim()) ||
    loginState.status === "awaiting_password";

  if (params.password?.trim() && loginState.passwordResolve) {
    loginState.passwordResolve(params.password.trim());
  } else if (needsPassword) {
    // Wait briefly for password callback to be registered after code acceptance
    for (let i = 0; i < 20; i++) {
      const status = loginState.status;
      if (loginState.passwordResolve) break;
      if (status === "completed" || status === "failed") break;
      await new Promise((r) => setTimeout(r, 250));
    }
    if (params.password?.trim() && loginState.passwordResolve) {
      loginState.passwordResolve(params.password.trim());
    } else if (loginState.status === "awaiting_password" && !params.password) {
      return "2FA password required. Call complete_login with { password }.";
    }
  }

  // Wait for start() to finish
  const pending = loginState.done;
  if (pending) {
    await Promise.race([pending, new Promise((r) => setTimeout(r, 15_000))]);
  }

  const finalStatus = loginState.status;
  if (finalStatus === "completed") {
    return "Login completed. Session saved. You can call get_me / list_dialogs.";
  }
  if (finalStatus === "awaiting_password") {
    return "Code accepted. 2FA password required — call complete_login with { password }.";
  }
  if (finalStatus === "failed") {
    return `Login failed: ${loginState.error ?? "unknown error"}`;
  }
  return `Login status: ${finalStatus}. If still awaiting_code, the code may be wrong or not yet delivered.`;
}

export function dialogPeerKey(entity: {
  id?: unknown;
  className?: string;
}): string {
  return String(entity.id ?? "");
}

export async function resolvePeer(target: string) {
  const c = await getClient(true);
  const trimmed = target.trim();

  if (trimmed === "me" || trimmed === "self") {
    return "me";
  }

  // Numeric dialog / user / chat id
  if (/^-?\d+$/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("@")) {
    return trimmed;
  }

  // Try username without @
  try {
    return await c.getEntity(trimmed);
  } catch {
    // Fall through to dialog title search
  }

  const dialogs = await c.getDialogs({ limit: 100 });
  const lower = trimmed.toLowerCase();
  const match = dialogs.find((d) => {
    const title = (d.title ?? d.name ?? "").toLowerCase();
    return title === lower || title.includes(lower);
  });
  if (!match?.entity) {
    throw new Error(
      `Could not resolve peer "${target}". Use list_dialogs / search_dialogs for an id or @username.`
    );
  }
  return match.entity;
}

export { Api };
