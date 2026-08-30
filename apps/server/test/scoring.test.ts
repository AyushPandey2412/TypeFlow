import assert from "node:assert/strict";
import test from "node:test";
import { calculateScore } from "../src/services/scoring.service.ts";

test("calculates correct and raw WPM independently", () => {
  const score = calculateScore({ target: "hello world", typedText: "hello xorld", durationMs: 60_000 });
  assert.equal(score.rawWpm, 2); assert.equal(score.correctWpm, 1); assert.equal(score.errors, 1); assert.equal(score.accuracy, 91);
});
test("caps progress and ignores characters beyond the issued target", () => {
  const score = calculateScore({ target: "abc", typedText: "abcdef", durationMs: 1000 });
  assert.equal(score.progress, 100); assert.equal(score.typedCharacters, 3);
});
test("contains insertion errors within their word", () => {
  const score = calculateScore({ target: "hello world again", typedText: "helo world again", durationMs: 60_000 });
  assert.deepEqual(score.characterStats, { correct: 15, incorrect: 1, extra: 0, missed: 1 });
  assert.equal(score.errors, 2);
  assert.equal(score.correctWpm, 2);
});
