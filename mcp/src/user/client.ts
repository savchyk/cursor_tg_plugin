import { TelegramClient, Api } from "teleproto";
import { StringSession } from "teleproto/sessions";
import { withFloodRetry, type RetryOptions } from "../shared/retry.js";
import {
  resolveCredentials,
  resolveSessionString,
  saveSession,
} from "./store.js";

export type LoginState = {
  status:
    | "idle"
    | "awaiting_code"
    | "awaiting_password"
    | "awaiting_qr"
    | "completed"
    | "failed";
  phone?: string;
  error?: string;
  qrUrl?: string;
  phoneCodeResolve?: (code: string) => void;
  passwordResolve?: (password: string) => void;
  done?: Promise<void>;
  abort?: AbortController;
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

export async function withUserFlood<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions
): Promise<T> {
  return withFloodRetry(fn, opts);
}

export async function startLogin(phone: string): Promise<string> {
  if (
    loginState.status === "awaiting_code" ||
    loginState.status === "awaiting_password" ||
    loginState.status === "awaiting_qr"
  ) {
    return `Login already in progress (${loginState.status}).`;
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

  await new Promise((r) => setTimeout(r, 800));

  if (loginState.status === "failed") {
    return `Login failed: ${loginState.error ?? "unknown error"}`;
  }

  return `Login started for ${normalized}. Telegram should send a code. Call complete_login with { code }.`;
}

export async function completeLogin(params: {
  code?: string;
  password?: string;
}): Promise<string> {
  const initial = loginState.status;
  if (initial === "idle" || initial === "completed") {
    return "No login in progress. Call start_login or start_qr_login first.";
  }
  if (initial === "failed") {
    return `Previous login failed: ${loginState.error ?? "unknown"}. Start again.`;
  }
  if (initial === "awaiting_qr") {
    if (params.password?.trim() && loginState.passwordResolve) {
      loginState.passwordResolve(params.password.trim());
    } else if (params.password?.trim()) {
      for (let i = 0; i < 40; i++) {
        if (loginState.passwordResolve) break;
        if (loginState.status === "completed" || loginState.status === "failed") break;
        await new Promise((r) => setTimeout(r, 250));
      }
      if (loginState.passwordResolve) {
        loginState.passwordResolve(params.password.trim());
      }
    }
    const pending = loginState.done;
    if (pending) {
      await Promise.race([pending, new Promise((r) => setTimeout(r, 20_000))]);
    }
    if (loginState.status === "completed") {
      return "QR login completed. Session saved.";
    }
    if (loginState.status === "awaiting_password") {
      return "QR scanned. 2FA password required — call complete_qr_login or complete_login with { password }.";
    }
    return `QR login status: ${loginState.status}. ${loginState.qrUrl ? `Current URL: ${loginState.qrUrl}` : ""}`;
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
    Boolean(params.password?.trim()) || loginState.status === "awaiting_password";

  if (params.password?.trim() && loginState.passwordResolve) {
    loginState.passwordResolve(params.password.trim());
  } else if (needsPassword) {
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
  return `Login status: ${finalStatus}.`;
}

export async function startQrLogin(): Promise<string> {
  if (
    loginState.status === "awaiting_code" ||
    loginState.status === "awaiting_password" ||
    loginState.status === "awaiting_qr"
  ) {
    return `Login already in progress (${loginState.status}).`;
  }

  const abort = new AbortController();
  loginState = { status: "awaiting_qr", abort };

  const c = await getClient(true);
  const { apiId, apiHash } = await resolveCredentials();

  loginState.done = c
    .signInUserWithQrCode(
      { apiId, apiHash },
      {
        qrCode: async ({ token, expires }) => {
          const url = `tg://login?token=${token.toString("base64url")}`;
          loginState.status = "awaiting_qr";
          loginState.qrUrl = url;
          loginState.error = undefined;
          // Keep latest URL on state; caller polls via auth_status / complete_qr_login
          void expires;
        },
        password: async () =>
          new Promise<string>((resolve) => {
            loginState.status = "awaiting_password";
            loginState.passwordResolve = resolve;
          }),
        onError: async (err) => {
          loginState.error = err instanceof Error ? err.message : String(err);
          return false;
        },
        abortSignal: abort.signal,
      }
    )
    .then(async () => {
      await persistClientSession();
      loginState = { status: "completed" };
    })
    .catch((err) => {
      if (abort.signal.aborted) {
        loginState = { status: "idle" };
        return;
      }
      loginState = {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      };
    });

  await new Promise((r) => setTimeout(r, 1000));

  if (loginState.status === "failed") {
    return `QR login failed: ${loginState.error ?? "unknown"}`;
  }

  return JSON.stringify(
    {
      message:
        "Scan this with Telegram → Settings → Devices → Link Desktop Device. Re-call complete_qr_login to refresh status; URL rotates ~30s.",
      qr_url: loginState.qrUrl,
      status: loginState.status,
    },
    null,
    2
  );
}

export async function completeQrLogin(params: {
  password?: string;
}): Promise<string> {
  if (loginState.status === "idle") {
    return "No QR login in progress. Call start_qr_login first.";
  }
  return completeLogin({ password: params.password });
}

export async function cancelLogin(): Promise<string> {
  if (loginState.abort) {
    loginState.abort.abort();
  }
  loginState = { status: "idle" };
  return "Login cancelled.";
}

export type PeerCandidate = {
  id?: string;
  title?: string;
  username?: string;
  is_forum?: boolean;
};

export async function resolvePeerCandidates(
  target: string
): Promise<{ peer?: any; candidates: PeerCandidate[]; ambiguous: boolean }> {
  const c = await getClient(true);
  const trimmed = target.trim();

  if (trimmed === "me" || trimmed === "self") {
    return { peer: "me", candidates: [{ id: "me", title: "Saved Messages" }], ambiguous: false };
  }

  if (/^-?\d+$/.test(trimmed) || trimmed.startsWith("@")) {
    return {
      peer: trimmed,
      candidates: [{ id: trimmed, title: trimmed }],
      ambiguous: false,
    };
  }

  try {
    const entity = await c.getEntity(trimmed);
    return {
      peer: entity,
      candidates: [
        {
          id: entity.id != null ? String(entity.id) : undefined,
          title:
            ("title" in entity && entity.title
              ? String(entity.title)
              : undefined) ||
            [("firstName" in entity && entity.firstName) || "", ("lastName" in entity && entity.lastName) || ""]
              .filter(Boolean)
              .join(" "),
          username:
            "username" in entity && entity.username
              ? `@${entity.username}`
              : undefined,
        },
      ],
      ambiguous: false,
    };
  } catch {
    // title search
  }

  const dialogs = await c.getDialogs({ limit: 100 });
  const lower = trimmed.toLowerCase();
  const matches = dialogs.filter((d) => {
    const title = (d.title ?? d.name ?? "").toLowerCase();
    return title === lower || title.includes(lower);
  });

  const candidates: PeerCandidate[] = matches.map((d) => ({
    id: d.id != null ? String(d.id) : undefined,
    title: d.title ?? d.name,
    username:
      d.entity && "username" in d.entity && d.entity.username
        ? `@${d.entity.username}`
        : undefined,
    is_forum: Boolean(
      d.entity && "forum" in d.entity && (d.entity as { forum?: boolean }).forum
    ),
  }));

  if (candidates.length === 0) {
    throw new Error(
      `Could not resolve peer "${target}". Use list_dialogs / search_dialogs for an id or @username.`
    );
  }

  if (candidates.length > 1) {
    const exact = matches.filter(
      (d) => (d.title ?? d.name ?? "").toLowerCase() === lower
    );
    if (exact.length === 1) {
      return {
        peer: exact[0].entity ?? exact[0].id,
        candidates: [
          {
            id: exact[0].id != null ? String(exact[0].id) : undefined,
            title: exact[0].title ?? exact[0].name,
          },
        ],
        ambiguous: false,
      };
    }
    return { candidates, ambiguous: true };
  }

  return {
    peer: matches[0].entity ?? matches[0].id,
    candidates,
    ambiguous: false,
  };
}

export async function resolvePeer(target: string): Promise<any> {
  const result = await resolvePeerCandidates(target);
  if (result.ambiguous) {
    throw new Error(
      `Ambiguous peer "${target}". Candidates: ${JSON.stringify(result.candidates)}. Use a numeric id or @username.`
    );
  }
  return result.peer!;
}

export async function listForumTopics(target: string) {
  const c = await getClient(true);
  const peer = await resolvePeer(target);
  return c.getForumTopics(peer, { limit: 100 });
}

export { Api };
