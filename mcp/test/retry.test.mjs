import test from "node:test";
import assert from "node:assert/strict";
import { getFloodWaitSeconds, withFloodRetry } from "../dist/shared/retry.js";

test("getFloodWaitSeconds reads seconds field", () => {
  assert.equal(getFloodWaitSeconds({ seconds: 12 }), 12);
});

test("getFloodWaitSeconds parses FLOOD_WAIT message", () => {
  assert.equal(getFloodWaitSeconds({ message: "FLOOD_WAIT_7" }), 7);
});

test("withFloodRetry surfaces flood error when not waiting", async () => {
  await assert.rejects(
    () =>
      withFloodRetry(async () => {
        const err = new Error("flood");
        err.seconds = 5;
        throw err;
      }),
    /Flood wait 5/
  );
});

test("withFloodRetry retries once when waitForFlood", async () => {
  let calls = 0;
  const result = await withFloodRetry(
    async () => {
      calls += 1;
      if (calls === 1) {
        const err = new Error("flood");
        err.seconds = 0;
        // 0 seconds means getFloodWaitSeconds returns null for <=0... use 1 but mock sleep via 0?
        // seconds: 1 would sleep 1s — use seconds that passes getFloodWaitSeconds
        err.seconds = 1;
        throw err;
      }
      return "ok";
    },
    { waitForFlood: true, maxWaitSec: 5 }
  );
  assert.equal(result, "ok");
  assert.equal(calls, 2);
});
