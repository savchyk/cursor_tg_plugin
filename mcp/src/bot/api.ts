const API_BASE = "https://api.telegram.org";

export class TelegramBotApiError extends Error {
  constructor(
    message: string,
    readonly errorCode?: number,
    readonly description?: string
  ) {
    super(message);
    this.name = "TelegramBotApiError";
  }
}

export function requireBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new TelegramBotApiError(
      "TELEGRAM_BOT_TOKEN is not set. Create a bot with @BotFather and set the token."
    );
  }
  return token;
}

type ApiOk<T> = { ok: true; result: T };
type ApiFail = { ok: false; error_code?: number; description?: string };

export async function botApi<T>(
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const token = requireBotToken();
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
    throw new TelegramBotApiError(
      data.description ?? `Telegram API error for ${method}`,
      data.error_code,
      data.description
    );
  }
  return data.result;
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
};

export type TelegramMessage = {
  message_id: number;
  date: number;
  chat: TelegramChat;
  text?: string;
  from?: TelegramUser;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
};
