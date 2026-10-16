import assert from "node:assert/strict";
import test from "node:test";
import { apiRequest, ApiError } from "../../web/services/api-client.ts";

test("concurrent expired requests share one refresh and retry with their original body", async () => {
  const original = globalThis.fetch;
  let refreshCount = 0;
  let refreshed = false;
  const bodies: unknown[] = [];
  globalThis.fetch = async (input, options) => {
    if (input === "/api/auth/refresh") {
      refreshCount++;
      await new Promise(resolve => setTimeout(resolve, 10));
      refreshed = true;
      return new Response("{}", { status: 200 });
    }
    bodies.push(options?.body);
    return new Response(JSON.stringify(refreshed ? { saved: true } : { error: "Expired" }), { status: refreshed ? 200 : 401 });
  };
  try {
    const options = { method: "POST", body: JSON.stringify({ typedText: "hello" }) };
    const results = await Promise.all([apiRequest("/api/races/one/complete", options), apiRequest("/api/races/two/complete", options)]);
    assert.equal(refreshCount, 1);
    assert.deepEqual(results, [{ saved: true }, { saved: true }]);
    assert.deepEqual(bodies, Array(4).fill(options.body));
  } finally { globalThis.fetch = original; }
});

test("failed login does not refresh and protected requests retry only once", async () => {
  const original = globalThis.fetch;
  const paths: unknown[] = [];
  globalThis.fetch = async input => {
    paths.push(input);
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: input === "/api/auth/refresh" ? 200 : 401 });
  };
  try {
    await assert.rejects(apiRequest("/api/auth/login", { method: "POST" }), ApiError);
    assert.deepEqual(paths, ["/api/auth/login"]);
    paths.length = 0;
    await assert.rejects(apiRequest("/api/friends"), ApiError);
    assert.deepEqual(paths, ["/api/friends", "/api/auth/refresh", "/api/friends"]);
  } finally { globalThis.fetch = original; }
});
