import assert from "node:assert/strict";
import test from "node:test";
import { matchmakingSchema, progressSchema, socketCompletionSchema } from "../src/validators/race.validator.ts";
import { friendCodeSchema } from "../src/validators/friend.validator.ts";

test("accepts supported matchmaking settings", () => {
  assert.deepEqual(matchmakingSchema.parse({ mode: "normal", wordCount: 50, numbers: false, punctuation: true }), { mode: "normal", wordCount: 50, numbers: false, punctuation: true, playerCount: 3 });
});

test("supports two- and three-player races and rejects other room sizes", () => {
  const options = { mode: "normal", wordCount: 50 };
  for (const playerCount of [2, 3]) {
    assert.equal(matchmakingSchema.parse({ ...options, playerCount }).playerCount, playerCount);
  }
  for (const playerCount of [0, 1, 4, 2.5]) {
    assert.equal(matchmakingSchema.safeParse({ ...options, playerCount }).success, false);
  }
});

test("rejects unsupported matchmaking settings", () => {
  assert.equal(matchmakingSchema.safeParse({ mode: "expert", wordCount: 30 }).success, false);
});

test("bounds progress and completion payloads", () => {
  assert.equal(progressSchema.safeParse({ raceId: "race-1", typedText: "x".repeat(20_001) }).success, false);
  assert.equal(socketCompletionSchema.safeParse({ raceId: "race-1", typedText: "done", durationMs: 130_001 }).success, false);
  assert.equal(socketCompletionSchema.safeParse({ raceId: "race-1", typedText: "done", durationMs: 1_000 }).success, true);
});
test("normalizes friend and private invitation codes", () => {
  assert.equal(friendCodeSchema.parse({ code: " ab12cd34 " }).code, "AB12CD34");
  const match=matchmakingSchema.parse({mode:"normal",wordCount:50,numbers:false,punctuation:false,inviteCode:"a1b2c3"});
  assert.equal(match.inviteCode,"A1B2C3");
});
