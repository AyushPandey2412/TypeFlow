import type { RaceMode } from "@typing/shared-types";
import { apiRequest, postJson } from "./api-client";
export type Friend = { id: string; displayName: string; friendCode: string };
export type RaceOptions = { mode: RaceMode; wordCount: 25 | 50 | 100; numbers: boolean; punctuation: boolean };
export type Invite = { code: string; from: { id: string; displayName: string }; options: RaceOptions; expiresAt: string };
export type FriendProfileData = { friend: { displayName: string; friendCode: string }; summary: { played: number; wins: number; losses: number; draws: number; myAverageWpm: number; friendAverageWpm: number }; history: { raceId: string; date: string; outcome: "win" | "loss" | "draw"; myWpm: number; friendWpm: number; myAccuracy: number; friendAccuracy: number }[] };
export const friendService = {
  list: () => apiRequest<{ friendCode: string; friends: Friend[] }>("/api/friends"),
  invites: () => apiRequest<{ invites: Invite[] }>("/api/friends/invites"),
  add: (code: string) => postJson<{ displayName: string }>("/api/friends", { code }),
  invite: (friendId: string, options: RaceOptions) => postJson<{ code: string }>(`/api/friends/${friendId}/invite`, options),
  profile: (friendId: string) => apiRequest<FriendProfileData>(`/api/friends/${friendId}/stats`),
};
