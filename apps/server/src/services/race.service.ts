import { randomUUID } from "node:crypto";
import { generateWords } from "@typing/word-lists";
import type { Player, RaceMode, RaceResult as ResultType, WordPacket } from "@typing/shared-types";
import { races, raceResults } from "../repositories/race.repository.js";
import { calculateScore } from "./scoring.service.js";

export type Identity = { id: string; displayName: string; role: "user" | "guest" };
export type RaceRoom = { id: string; mongoId: string; status: "waiting" | "countdown" | "running" | "finished"; players: Map<string, Player & { identity: Identity }>; packet: WordPacket; wordCount:25|50|100; maxPlayers:number; inviteCode?:string; results: ResultType[]; completedPlayerIds: Set<string>; createdAt: number; startsAt?: number; timer?: NodeJS.Timeout; expiryTimer?:NodeJS.Timeout };
const rooms = new Map<string, RaceRoom>();
const disconnectTimers=new Map<string,NodeJS.Timeout>();
export const getRoom = (id: string) => rooms.get(id);

export async function matchmake(socketId: string, identity: Identity, options: { mode: RaceMode; wordCount: 25 | 50 | 100; numbers: boolean; punctuation: boolean; inviteCode?:string }) {
  const previous=[...rooms.values()].find(value=>[...value.players.values()].some(player=>player.id===identity.id)&&value.status!=="finished");
  if(previous){const old=[...previous.players.entries()].find(([,player])=>player.id===identity.id);if(old){previous.players.delete(old[0]);previous.players.set(socketId,{...old[1],connected:true});const timer=disconnectTimers.get(identity.id);if(timer)clearTimeout(timer);disconnectTimers.delete(identity.id);return previous;}}
  let room = [...rooms.values()].find(value => value.status === "waiting" && value.players.size < value.maxPlayers && value.inviteCode===options.inviteCode && value.packet.mode === options.mode && value.wordCount===options.wordCount && value.packet.includeNumbers===options.numbers && value.packet.includePunctuation===options.punctuation);
  if (!room) {
    const seed = randomUUID();
    const words = generateWords({ seed, count: Math.max(options.wordCount, 100), list: options.mode === "hard" ? "hard" : "common", numbers: options.numbers, punctuation: options.punctuation });
    const packet: WordPacket = { id: randomUUID(), seed, words, mode: options.mode, includeNumbers: options.numbers, includePunctuation: options.punctuation, issuedAt: new Date().toISOString() };
    const race = await races.create({ kind: "multiplayer", status: "waiting", wordPacket: { packetId: packet.id, ...packet }, participantIds: [identity.id] });
    room = { id: randomUUID(), mongoId: String(race._id), status: "waiting", players: new Map(), packet, wordCount:options.wordCount, maxPlayers:options.inviteCode?2:3, inviteCode:options.inviteCode, results: [], completedPlayerIds: new Set(), createdAt: Date.now() };
    rooms.set(room.id, room);
  }
  room.players.set(socketId, { id: identity.id, displayName: identity.displayName, role: identity.role, progress: 0, wpm: 0, connected: true, identity });
  await races.update(room.mongoId, { participantIds: [...room.players.values()].map(player => player.id) });
  return room;
}
export const publicRace = (room: RaceRoom) => ({ id: room.id, kind: "multiplayer" as const, status: room.status, wordPacket: room.packet, players: [...room.players.values()].map(({ identity: _, ...player }) => player), startsAt: room.startsAt ? new Date(room.startsAt).toISOString() : undefined });
export function start(room: RaceRoom) { room.status = "countdown"; room.startsAt = Date.now() + 3000; void races.update(room.mongoId, { status: "countdown", startsAt: new Date(room.startsAt) }); }
export function markRunning(room: RaceRoom) { room.status = "running"; void races.update(room.mongoId, { status: "running" }); }
export function armExpiry(room:RaceRoom,onExpire:()=>void){room.expiryTimer=setTimeout(()=>{if(room.status==="finished")return;room.status="finished";void races.update(room.mongoId,{status:"finished",endsAt:new Date()});onExpire();},130_000);}
export function stats(room: RaceRoom, typedText: string, durationMs: number) {
  const target = room.packet.words.join(" "); return { ...calculateScore({ target, typedText, durationMs }), target };
}
export async function complete(room: RaceRoom, player: Player & { identity: Identity }, typedText: string, durationMs: number): Promise<ResultType> {
  const duplicate = room.completedPlayerIds.has(player.id); const value = stats(room, typedText, durationMs); const serverDuration = room.startsAt ? Date.now() - room.startsAt : durationMs;
  const timingDifference = Math.abs(serverDuration - durationMs); const valid = !duplicate && room.status !== "finished" && durationMs > 500 && durationMs < 130000 && timingDifference < 5000;
  const result = { raceId: room.id, playerId: player.id, rawWpm: value.rawWpm, correctWpm: value.correctWpm, accuracy: value.accuracy, errors: value.errors, durationMs, valid };
  if (valid && player.role === "user") await raceResults.create({ ...result, raceId: room.mongoId, userId: player.id });
  if (!duplicate) { room.completedPlayerIds.add(player.id); room.results.push(result); }
  if (room.results.length >= room.players.size) { room.status = "finished"; await races.update(room.mongoId, { status: "finished", endsAt: new Date() }); }
  return result;
}
export function updateProgress(room: RaceRoom, socketId: string, typedText: string) {
  const player = room.players.get(socketId); if (!player || !room.startsAt) return;
  const value = stats(room, typedText, Math.max(Date.now() - room.startsAt, 1000)); player.progress = value.progress; player.wpm = value.correctWpm;
  const { identity: _, ...publicPlayer } = player; return publicPlayer;
}
export function remove(socketId: string) { for (const room of rooms.values()) { const player=room.players.get(socketId);if(!player)continue;player.connected=false;disconnectTimers.set(player.id,setTimeout(()=>{room.players.delete(socketId);disconnectTimers.delete(player.id);if(room.players.size===0){if(room.timer)clearTimeout(room.timer);if(room.expiryTimer)clearTimeout(room.expiryTimer);rooms.delete(room.id);void races.update(room.mongoId,{status:"cancelled",endsAt:new Date()});}},15_000));return room; } }
