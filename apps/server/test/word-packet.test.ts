import assert from "node:assert/strict";
import test from "node:test";
import { generateWords } from "@typing/word-lists";

test("word packets are deterministic for the same options", () => {
  const options = { seed: "race-42", count: 100, list: "common" as const, numbers: true, punctuation: true };
  assert.deepEqual(generateWords(options), generateWords(options));
});
test("different seeds issue different packets", () => {
  assert.notDeepEqual(generateWords({ seed: "a", count: 25, list: "hard" }), generateWords({ seed: "b", count: 25, list: "hard" }));
});
