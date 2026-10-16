import type { Lesson } from "./course";

export const masteryRounds = 2;
export type LessonProgress = {
  accuracy: number;
  successes: number;
  attempts: number;
  practiceMs: number;
  recentAccuracy: number[];
  errorsByKey: Record<string, number>;
  completedAt?: string;
};
export type SavedProgress = Record<string, LessonProgress>;

function boundedNumber(value: unknown, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

export function parseProgress(value: unknown, lessons: Lesson[]): SavedProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: SavedProgress = {};
  for (const lesson of lessons) {
    const entry = (value as Record<string, unknown>)[lesson.id];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const row = entry as Record<string, unknown>;
    if (!boundedNumber(row.accuracy, 100)) continue;
    const completedAt = typeof row.completedAt === "string" && Number.isFinite(Date.parse(row.completedAt)) ? row.completedAt : undefined;
    const legacy = row.successes === undefined && completedAt && (row.accuracy as number) >= lesson.passAccuracy;
    const successes = legacy ? masteryRounds : boundedNumber(row.successes, 100_000) ? Math.floor(row.successes as number) : 0;
    const errors: Record<string, number> = {};
    if (row.errorsByKey && typeof row.errorsByKey === "object") {
      for (const [key, count] of Object.entries(row.errorsByKey)) {
        if (key.length === 1 && lesson.target.includes(key) && boundedNumber(count, 100_000)) errors[key] = Math.floor(count as number);
      }
    }
    result[lesson.id] = {
      accuracy: row.accuracy as number,
      successes,
      attempts: Math.max(successes, boundedNumber(row.attempts, 100_000) ? Math.floor(row.attempts as number) : 0),
      practiceMs: boundedNumber(row.practiceMs, 1_000_000_000) ? row.practiceMs as number : 0,
      recentAccuracy: Array.isArray(row.recentAccuracy) ? row.recentAccuracy.filter(item => boundedNumber(item, 100)).slice(-10) : [],
      errorsByKey: errors,
      ...(successes >= masteryRounds && completedAt ? { completedAt } : {}),
    };
  }
  return result;
}

export function isMastered(progress: LessonProgress | undefined) {
  return Boolean(progress && progress.successes >= masteryRounds);
}

export function nextLessonIndex(progress: SavedProgress, lessons: Lesson[]) {
  const index = lessons.findIndex(lesson => !isMastered(progress[lesson.id]));
  return index < 0 ? lessons.length - 1 : index;
}

export function buildPracticeTarget(lesson: Lesson, round: number, weakKeys: string[] = []) {
  const keys = [...new Set(weakKeys)].filter(key => key.length === 1 && lesson.target.includes(key));
  if (keys.length) {
    // Review only taught characters; do not introduce spaces in the anchor lesson.
    const separator = lesson.target.includes(" ") ? " " : "";
    const groups = keys.map((key, index) => key + key + keys[(index + 1) % keys.length] + key);
    return Array.from({ length: 8 }, (_, index) => groups[(index + round) % groups.length]).join(separator);
  }
  const groups = lesson.target.includes(" ") ? lesson.target.split(" ") : [...lesson.target];
  const separator = lesson.target.includes(" ") ? " " : "";
  const count = Math.max(groups.length, Math.ceil(70 / (lesson.target.length / groups.length)));
  return Array.from({ length: count }, (_, index) => groups[(index + round) % groups.length]).join(separator);
}

export function recordAttempt(progress: SavedProgress, lesson: Lesson, accuracy: number, practiceMs: number, errorsByKey: Record<string, number>, review: boolean): SavedProgress {
  const previous = progress[lesson.id];
  const successes = (previous?.successes || 0) + (!review && accuracy >= lesson.passAccuracy ? 1 : 0);
  const errors = { ...previous?.errorsByKey };
  for (const [key, count] of Object.entries(errorsByKey)) errors[key] = (errors[key] || 0) + count;
  return { ...progress, [lesson.id]: {
    accuracy: Math.max(previous?.accuracy || 0, accuracy), successes,
    attempts: (previous?.attempts || 0) + 1,
    practiceMs: (previous?.practiceMs || 0) + Math.max(0, practiceMs),
    recentAccuracy: [...(previous?.recentAccuracy || []), accuracy].slice(-10),
    errorsByKey: errors,
    ...(successes >= masteryRounds ? { completedAt: previous?.completedAt || new Date().toISOString() } : {}),
  } };
}

export function mergeProgress(local: SavedProgress, remote: SavedProgress): SavedProgress {
  const merged = { ...local };
  for (const [id, other] of Object.entries(remote)) {
    const own = merged[id];
    if (!own) { merged[id] = other; continue; }
    const latest = other.attempts > own.attempts ? other : own;
    merged[id] = { ...latest,
      accuracy: Math.max(own.accuracy, other.accuracy),
      successes: Math.max(own.successes, other.successes),
      attempts: Math.max(own.attempts, other.attempts),
      practiceMs: Math.max(own.practiceMs, other.practiceMs),
      completedAt: own.completedAt || other.completedAt,
    };
  }
  return merged;
}
