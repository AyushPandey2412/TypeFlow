import type { RaceMode, WordPacket } from "@typing/shared-types";
import { apiRequest, postJson } from "./api-client";
export type ResultEntry = { rank?: number; displayName?: string; correctWpm: number; rawWpm: number; accuracy: number; valid?: boolean; createdAt: string };
export type SoloRace = { raceId: string; wordPacket: WordPacket };
export const raceService = {
  results: (kind: "leaderboard" | "history") => apiRequest<{ entries: ResultEntry[] }>(`/api/races/${kind}`),
  socketToken: () => apiRequest<{ token: string }>("/api/socket-token"),
  createSolo: (body: { mode: RaceMode; wordCount: number; timed: boolean; numbers: boolean; punctuation: boolean }) => postJson<SoloRace>("/api/races/solo", body),
  startSolo: (raceId: string) => postJson(`/api/races/${raceId}/start`),
  extendSolo: (raceId: string) => postJson<{ words: string[] }>(`/api/races/${raceId}/extend`),
  completeSolo: (raceId: string, body: { typedText: string; durationMs: number }) => postJson(`/api/races/${raceId}/complete`, body),
};
