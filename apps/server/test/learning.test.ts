import assert from "node:assert/strict";
import test from "node:test";
import { beginnerLessons, fingerByKey, fingersForExpectedKey, physicalKey } from "../../web/features/learn/course.ts";
import { buildPracticeTarget, isMastered, mergeProgress, nextLessonIndex, parseProgress, recordAttempt } from "../../web/features/learn/progress.ts";

test("course introduces each character before using it in exercises", () => {
  const introduced = new Set<string>();
  assert.equal(beginnerLessons.length, 25);
  for (const lesson of beginnerLessons) {
    lesson.keys.forEach(key => introduced.add(key));
    for (const key of lesson.target) {
      assert.ok(introduced.has(key), `${lesson.id} uses untaught ${JSON.stringify(key)}`);
      assert.ok(fingerByKey[physicalKey(key)], `${key} has no finger mapping`);
    }
  }
});

test("practice rounds vary and only contain the lesson's taught characters", () => {
  for (const lesson of beginnerLessons) {
    const first = buildPracticeTarget(lesson, 0);
    const second = buildPracticeTarget(lesson, 1);
    assert.ok(first.length >= 60);
    assert.notEqual(first, second);
    for (const key of first + second) assert.ok(lesson.target.includes(key));
  }
});

test("focused drills use missed keys without adding new keys or unlocking lessons", () => {
  const lesson = beginnerLessons[0];
  const drill = buildPracticeTarget(lesson, 0, ["f", "x"]);
  assert.ok([...drill].every(key => key === "f"));
  const progress = recordAttempt({}, lesson, 100, 1000, {}, true);
  assert.equal(isMastered(progress[lesson.id]), false);
  assert.equal(progress[lesson.id].successes, 0);
  assert.equal(progress[lesson.id].attempts, 1);
});

test("mastery requires two successful full rounds and preserves attempt history", () => {
  const lesson = beginnerLessons[0];
  let progress = recordAttempt({}, lesson, 80, 2000, { f: 2 }, false);
  progress = recordAttempt(progress, lesson, 95, 3000, {}, false);
  assert.equal(nextLessonIndex(progress, beginnerLessons), 0);
  progress = recordAttempt(progress, lesson, 100, 4000, {}, false);
  assert.equal(nextLessonIndex(progress, beginnerLessons), 1);
  assert.equal(progress[lesson.id].practiceMs, 9000);
  assert.deepEqual(progress[lesson.id].recentAccuracy, [80, 95, 100]);
  assert.deepEqual(progress[lesson.id].errorsByKey, { f: 2 });
});

test("corrupt stored progress is ignored and legacy completions are preserved", () => {
  for (const value of [null, [], "bad", 4, { anchors: null }, { anchors: { accuracy: 101 } }]) {
    assert.deepEqual(parseProgress(value, beginnerLessons), {});
  }
  const progress = parseProgress({ anchors: { accuracy: 95, completedAt: "2026-10-16T00:00:00.000Z" }, unknown: { accuracy: 100 } }, beginnerLessons);
  assert.equal(isMastered(progress.anchors), true);
  assert.deepEqual(Object.keys(progress), ["anchors"]);
});

test("sync merges progress without downgrading completed lessons or double counting", () => {
  const lesson = beginnerLessons[0];
  const first = recordAttempt({}, lesson, 95, 1000, {}, false);
  const second = recordAttempt(first, lesson, 100, 2000, {}, false);
  assert.equal(isMastered(mergeProgress(second, first).anchors), true);
  assert.deepEqual(mergeProgress(second, second), second);
});

test("shifted punctuation uses the opposite pinky and correct physical key", () => {
  assert.deepEqual(fingersForExpectedKey("!"), ["left-pinky", "right-pinky"]);
  assert.deepEqual(fingersForExpectedKey("?"), ["right-pinky", "left-pinky"]);
  assert.equal(physicalKey(":"), ";");
});
