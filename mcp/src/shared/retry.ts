import { sleep } from "./result.js";

const MAX_AUTO_WAIT_SEC = 60;

export type RetryOptions = {
  /** If true, sleep up to MAX_AUTO_WAIT_SEC and retry once. */
  waitForFlood?: boolean;
  maxWaitSec?: number;
};

export function getFloodWaitSeconds(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const anyErr = err as {
    seconds?: number;
    errorMessage?: string;
    message?: string;
    retry_after?: number;
  };
  if (typeof anyErr.seconds === "number" && anyErr.seconds > 0) {
    return anyErr.seconds;
  }
  if (typeof anyErr.retry_after === "number" && anyErr.retry_after > 0) {
    return anyErr.retry_after;
  }
  const msg = `${anyErr.errorMessage ?? ""} ${anyErr.message ?? ""}`;
  const m = /retry after (\d+)/i.exec(msg) || /FLOOD_WAIT[_\s]?(\d+)/i.exec(msg);
  if (m) return Number(m[1]);
  return null;
}

export async function withFloodRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const seconds = getFloodWaitSeconds(err);
    if (seconds == null) throw err;

    const maxWait = opts.maxWaitSec ?? MAX_AUTO_WAIT_SEC;
    if (!opts.waitForFlood || seconds > maxWait) {
      const e = new Error(
        `Flood wait ${seconds}s. Retry after that, or pass wait_for_flood=true (caps at ${maxWait}s auto-wait).`
      );
      (e as Error & { retry_after: number }).retry_after = seconds;
      throw e;
    }

    console.error(`[telegram-mcp] FloodWait ${seconds}s — sleeping then retrying once`);
    await sleep(seconds * 1000);
    return await fn();
  }
}
