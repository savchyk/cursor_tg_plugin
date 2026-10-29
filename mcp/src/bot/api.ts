import { withFloodRetry, type RetryOptions } from "../shared/retry.js";
import { resolveBotToken } from "./tokens.js";

const API_BASE = "https://api.telegram.org";

export class TelegramBotApiError extends Error {
  constructor(
    message: string,
    readonly errorCode?: number,
    readonly description?: string,
    readonly retry_after?: number
  ) {
    super(message);
    this.name = "TelegramBotApiError";
  }
}

type ApiOk<T> = { ok: true; result: T };
type ApiFail = {
  ok: false;
  error_code?: number;
  description?: string;
  parameters?: { retry_after?: number };
};

export async function botApi<T>(
  method: string,
  body?: Record<string, unknown>,
  opts?: { bot?: string } & RetryOptions
): Promise<T> {
  const { token } = await resolveBotToken(opts?.bot);

  return withFloodRetry(async () => {
    const url = `${API_BASE}/bot${token}/${method}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });

    let data: ApiOk<T> | ApiFail;
    try {
      data = (await res.json()) as ApiOk<T> | ApiFail;
    } catch {
      throw new TelegramBotApiError(
        `Telegram API returned non-JSON (HTTP ${res.status}) for ${method}`
      );
    }

    if (!data.ok) {
      const retryAfter = data.parameters?.retry_after;
      const err = new TelegramBotApiError(
        data.description ?? `Telegram API error for ${method}`,
        data.error_code,
        data.description,
        retryAfter
      );
      if (retryAfter) {
        (err as Error & { seconds: number }).seconds = retryAfter;
      }
      throw err;
    }
    return data.result;
  }, { waitForFlood: opts?.waitForFlood, maxWaitSec: opts?.maxWaitSec });
}

/** @deprecated use resolveBotToken — kept for simple call sites */
export async function requireBotToken(bot?: string): Promise<string> {
  const { token } = await resolveBotToken(bot);
  return token;
}

export type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
};

export type TelegramChat = {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_forum?: boolean;
};

export type TelegramMessage = {
  message_id: number;
  date: number;
  chat: TelegramChat;
  text?: string;
  from?: TelegramUser;
  message_thread_id?: number;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
};

export function chatLabel(chat: TelegramChat): string {
  if (chat.title) return chat.title;
  const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
  if (name) return name;
  if (chat.username) return `@${chat.username}`;
  return String(chat.id);
}
