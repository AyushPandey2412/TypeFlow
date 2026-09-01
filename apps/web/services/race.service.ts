import type { Race, RaceMode, RaceResult, WordPacket } from "@typing/shared-types";
import { apiRequest, postJson } from "./api-client";
export type ResultEntry = { rank?: number; displayName?: string; correctWpm: number; rawWpm: number; accuracy: number; valid?: boolean; createdAt: string };
export type SoloRace = { raceId: string; wordPacket: WordPacket };
export type MultiplayerState = { race: Race; packet: WordPacket; results: RaceResult[] };
export const raceService = {
  results: (kind: "leaderboard" | "history") => apiRequest<{ entries: ResultEntry[] }>(`/api/races/${kind}`),
  socketToken: () => apiRequest<{ token: string }>("/api/socket-token"),
  createSolo: (body: { mode: RaceMode; wordCount: number; timed: boolean; numbers: boolean; punctuation: boolean }) => postJson<SoloRace>("/api/races/solo", body),
  startSolo: (raceId: string) => postJson(`/api/races/${raceId}/start`),
  extendSolo: (raceId: string) => postJson<{ words: string[] }>(`/api/races/${raceId}/extend`),
  completeSolo: (raceId: string, body: { typedText: string; durationMs: number }) => postJson(`/api/races/${raceId}/complete`, body),
  matchmake: (body: { mode: RaceMode; wordCount: 25 | 50 | 100; playerCount?: 2 | 3; numbers: boolean; punctuation: boolean; inviteCode?: string }) => postJson<MultiplayerState>("/api/multiplayer/matchmake", body),
  multiplayerState: (raceId: string) => apiRequest<MultiplayerState>(`/api/multiplayer/state?raceId=${encodeURIComponent(raceId)}`),
  multiplayerProgress: (body: { raceId: string; typedText: string }) => postJson<MultiplayerState>("/api/multiplayer/progress", body),
  completeMultiplayer: (body: { raceId: string; typedText: string; durationMs: number }) => postJson<MultiplayerState>("/api/multiplayer/complete", body),
  leaveMultiplayer: () => postJson<{ race: Race | null }>("/api/multiplayer/leave", {}),
};
