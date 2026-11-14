import { randomUUID } from "node:crypto";
import { randomBytes } from "node:crypto";
import type { Player, RaceMode, RaceResult, WordPacket } from "@typing/shared-types";
import { generateWords } from "@typing/word-lists";
import type Redis from "ioredis";
import { races, raceResults } from "../../server/src/repositories/race.repository.js";
import { calculateScore } from "../../server/src/services/scoring.service.js";

export type Identity = { id: string; displayName: string; role: "user" | "guest" };
type StoredPlayer = Player & { identity: Identity; socketId: string };
export type StoredRoom = {
  id: string;
  mongoId: string;
  status: "waiting" | "countdown" | "running" | "finished" | "cancelled";
  players: Record<string, StoredPlayer>;
  packet: WordPacket;
  wordCount: 25 | 50 | 100;
  maxPlayers: number;
  inviteCode?: string;
  hostId: string;
  results: RaceResult[];
  completedPlayerIds: string[];
  createdAt: number;
  startsAt?: number;
};
type Options = { mode: RaceMode; wordCount: 25 | 50 | 100; playerCount?: 2 | 3; numbers: boolean; punctuation: boolean; inviteCode?: string };

const roomKey = (id: string) => `typeflow:room:${id}`;
const playerKey = (id: string) => `typeflow:player-room:${id}`;
const privateRoomKey = (code: string) => `typeflow:private-room:${code.toUpperCase()}`;
const inviteRoomKey = (code: string) => `typeflow:invite-room:${code.toUpperCase()}`;
const queueKey = (options: Options) => `typeflow:queue:${options.mode}:${options.wordCount}:${options.playerCount || 3}:${Number(options.numbers)}:${Number(options.punctuation)}`;
const publicPlayer = (player: StoredPlayer): Player => ({ id: player.id, displayName: player.displayName, role: player.role, progress: player.progress, wpm: player.wpm, connected: player.connected });

async function load(redis: Redis, id: string) { const value = await redis.get(roomKey(id)); return value ? JSON.parse(value) as StoredRoom : null; }
async function save(redis: Redis, room: StoredRoom) { await redis.set(roomKey(room.id), JSON.stringify(room), "EX", 900); return room; }

async function locked<T>(redis: Redis, key: string, task: () => Promise<T>): Promise<T> {
  const token = randomUUID();
  for (let attempt = 0; attempt < 20; attempt++) {
    if (await redis.set(`typeflow:lock:${key}`, token, "PX", 4000, "NX")) {
      try { return await task(); }
      finally { await redis.eval("if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end", 1, `typeflow:lock:${key}`, token); }
    }
    await new Promise(resolve => setTimeout(resolve, 40 + attempt * 10));
  }
  throw new Error("Race state is busy");
}

export async function matchmake(redis: Redis, socketId: string, identity: Identity, options: Options): Promise<StoredRoom> {
  const previousId = await redis.get(playerKey(identity.id));
  if (previousId) {
    const previous = await load(redis, previousId);
    const sameInvite = (!options.inviteCode && !previous?.inviteCode) || (Boolean(options.inviteCode) && previous?.inviteCode === options.inviteCode);
    if (previous && (previous.status === "waiting" || previous.status === "countdown" || previous.status === "running") && previous.players[identity.id] && sameInvite) {
      previous.players[identity.id] = { ...previous.players[identity.id], socketId, connected: true };
      return save(redis, previous);
    } else {
      await redis.del(playerKey(identity.id));
    }
  }

  const lockKey = options.inviteCode ? `invite:${options.inviteCode}` : queueKey(options);
  return locked(redis, lockKey, async () => {
    let room: StoredRoom | null = null;

    if (options.inviteCode) {
      const inviteKey = inviteRoomKey(options.inviteCode);
      const existingRoomId = await redis.get(inviteKey);
      if (existingRoomId) {
        room = await load(redis, existingRoomId);
      }
    } else {
      const queuedId = await redis.get(queueKey(options));
      if (queuedId) {
        room = await load(redis, queuedId);
      }
    }

    const canJoinRoom = room && (room.status === "waiting" || room.players[identity.id] !== undefined) && (Object.keys(room.players).length < room.maxPlayers || room.players[identity.id] !== undefined);

    if (!canJoinRoom || !room) {
      const seed = randomUUID();
      const words = generateWords({ seed, count: Math.max(options.wordCount, 100), list: options.mode === "hard" ? "hard" : "common", numbers: options.numbers, punctuation: options.punctuation });
      const packet: WordPacket = { id: randomUUID(), seed, words, mode: options.mode, includeNumbers: options.numbers, includePunctuation: options.punctuation, issuedAt: new Date().toISOString() };
      const race = await races.create({ kind: "multiplayer", status: "waiting", wordPacket: { packetId: packet.id, ...packet }, participantIds: [identity.id] });
      room = {
        id: randomUUID(),
        mongoId: String(race._id),
        status: "waiting",
        players: {},
        packet,
        wordCount: options.wordCount,
        maxPlayers: options.playerCount || (options.inviteCode ? 2 : 3),
        inviteCode: options.inviteCode,
        hostId: identity.id,
        results: [],
        completedPlayerIds: [],
        createdAt: Date.now(),
      };
      if (options.inviteCode) {
        await redis.set(inviteRoomKey(options.inviteCode), room.id, "EX", 900);
      } else {
        await redis.set(queueKey(options), room.id, "EX", 45);
      }
    }

    const currentRoom: StoredRoom = room;
    currentRoom.players[identity.id] = { id: identity.id, displayName: identity.displayName, role: identity.role, progress: 0, wpm: 0, connected: true, identity, socketId };
    await save(redis, currentRoom);
    await redis.set(playerKey(identity.id), currentRoom.id, "EX", 900);
    await races.update(currentRoom.mongoId, { participantIds: Object.keys(currentRoom.players) });
    return currentRoom;
  });
}

export function publicRace(room: StoredRoom) {
  return {
    id: room.id,
    kind: "multiplayer" as const,
    status: room.status,
    wordPacket: room.packet,
    players: Object.values(room.players).map(publicPlayer),
    startsAt: room.startsAt ? new Date(room.startsAt).toISOString() : undefined,
    hostId: room.hostId,
    roomCode: room.inviteCode,
  };
}

export async function begin(redis: Redis, roomId: string) { return locked(redis, roomId, async () => { const room = await load(redis, roomId); if (!room || room.status !== "waiting") return room; room.status = "countdown"; room.startsAt = Date.now() + 3000; await save(redis, room); await races.update(room.mongoId, { status: "countdown", startsAt: new Date(room.startsAt) }); return room; }); }
export async function markRunning(redis: Redis, roomId: string) { return locked(redis, roomId, async () => { const room = await load(redis, roomId); if (!room || room.status !== "countdown") return room; room.status = "running"; await save(redis, room); await races.update(room.mongoId, { status: "running" }); return room; }); }
export async function expire(redis: Redis, roomId: string) { return locked(redis, roomId, async () => { const room = await load(redis, roomId); if (!room || room.status === "finished") return room; room.status = "finished"; await save(redis, room); await races.update(room.mongoId, { status: "finished", endsAt: new Date() }); return room; }); }

export async function startRace(redis: Redis, roomId: string, identityId: string) {
  return locked(redis, roomId, async () => {
    const room = await load(redis, roomId);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== identityId) throw new Error("Only the host can start the race");
    if (room.status !== "waiting") return room;
    const now = Date.now();
    room.status = "countdown";
    room.startsAt = now + 3000;
    await save(redis, room);
    await races.update(room.mongoId, { status: "countdown", startsAt: new Date(room.startsAt) });
    return room;
  });
}

export async function stopRace(redis: Redis, roomId: string, identityId: string) {
  return locked(redis, roomId, async () => {
    const room = await load(redis, roomId);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== identityId) throw new Error("Only the host can stop the race");
    room.status = "cancelled";
    await save(redis, room);
    await races.update(room.mongoId, { status: "cancelled", endsAt: new Date() });
    return room;
  });
}

export async function updateProgress(redis: Redis, roomId: string, identityId: string, typedText: string) { return locked(redis, roomId, async () => { const room = await load(redis, roomId); const player = room?.players[identityId]; if (!room || !player || !room.startsAt) return null; const score = calculateScore({ target: room.packet.words.join(" "), typedText, durationMs: Math.max(Date.now() - room.startsAt, 1000) }); player.progress = score.progress; player.wpm = score.correctWpm; await save(redis, room); return publicPlayer(player); }); }

export async function complete(redis: Redis, roomId: string, identityId: string, typedText: string, durationMs: number) { return locked(redis, roomId, async () => {
  const room = await load(redis, roomId); const player = room?.players[identityId]; if (!room || !player) return null;
  const duplicate = room.completedPlayerIds.includes(identityId); const score = calculateScore({ target: room.packet.words.join(" "), typedText, durationMs }); const serverDuration = room.startsAt ? Date.now() - room.startsAt : durationMs;
  const valid = !duplicate && room.status !== "finished" && durationMs > 500 && durationMs < 130000 && Math.abs(serverDuration - durationMs) < 5000;
  const result: RaceResult = { raceId: room.id, playerId: identityId, rawWpm: score.rawWpm, correctWpm: score.correctWpm, accuracy: score.accuracy, errors: score.errors, durationMs, valid };
  if (valid && player.role === "user") await raceResults.create({ ...result, raceId: room.mongoId, userId: identityId });
  if (!duplicate) { room.completedPlayerIds.push(identityId); room.results.push(result); }
  if (room.results.length >= Object.keys(room.players).length) { room.status = "finished"; await races.update(room.mongoId, { status: "finished", endsAt: new Date() }); }
  await save(redis, room); return room;
}); }

export async function disconnect(redis: Redis, identityId: string) {
  const roomId = await redis.get(playerKey(identityId));
  if (!roomId) return null;
  await redis.del(playerKey(identityId));
  return locked(redis, roomId, async () => {
    const room = await load(redis, roomId);
    if (!room) return null;
    const isHost = room.hostId === identityId;
    delete room.players[identityId];
    if (isHost && (room.status === "waiting" || room.status === "countdown")) {
      room.status = "cancelled";
      await races.update(room.mongoId, { status: "cancelled", endsAt: new Date() });
    } else if (Object.keys(room.players).length === 0) {
      room.status = "cancelled";
      await races.update(room.mongoId, { status: "cancelled", endsAt: new Date() });
    }
    await save(redis, room);
    return room;
  });
}

export async function getRoomState(redis: Redis, identityId: string, requestedRoomId?: string) {
  const roomId = requestedRoomId || await redis.get(playerKey(identityId));
  if (!roomId) return null;
  return locked(redis, roomId, async () => {
    const room = await load(redis, roomId);
    if (!room || !room.players[identityId]) return null;
    const now = Date.now();
    const playerCount = Object.keys(room.players).length;

    if (room.status === "waiting") {
      const isPublic = !room.inviteCode;
      if (isPublic && (playerCount >= room.maxPlayers || (playerCount >= 2 && now >= room.createdAt + 10_000))) {
        room.status = "countdown";
        room.startsAt = now + 3000;
        await races.update(room.mongoId, { status: "countdown", startsAt: new Date(room.startsAt) });
      }
    } else if (room.status === "countdown" && room.startsAt && now >= room.startsAt) {
      room.status = "running";
      await races.update(room.mongoId, { status: "running" });
    } else if (room.status === "running" && room.startsAt && now >= room.startsAt + 130_000) {
      room.status = "finished";
      await races.update(room.mongoId, { status: "finished", endsAt: new Date() });
    }
    room.players[identityId].connected = true;
    await save(redis, room);
    return room;
  });
}

export async function createPrivateRoom(redis: Redis, identity: Identity, options: Omit<Options, "inviteCode">) {
  let code = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    code = randomBytes(3).toString("hex").toUpperCase();
    if (await redis.set(privateRoomKey(code), "1", "EX", 900, "NX")) break;
  }
  if (!code) throw new Error("Unable to create room code");
  const room = await matchmake(redis, identity.id, identity, { ...options, inviteCode: code });
  await redis.set(privateRoomKey(code), JSON.stringify({ roomId: room.id, options }), "EX", 900);
  return { room, code };
}

export async function joinPrivateRoom(redis: Redis, identity: Identity, code: string) {
  const normalized = code.trim().toUpperCase();
  const value = await redis.get(privateRoomKey(normalized));
  if (!value) return null;
  try {
    const data = JSON.parse(value);
    const roomId = data.roomId;
    if (roomId) {
      return locked(redis, roomId, async () => {
        const room = await load(redis, roomId);
        if (!room) return null;
        if (room.status !== "waiting" && !room.players[identity.id]) {
          return null;
        }
        if (Object.keys(room.players).length >= room.maxPlayers && !room.players[identity.id]) {
          return null;
        }
        room.players[identity.id] = {
          id: identity.id,
          displayName: identity.displayName,
          role: identity.role,
          progress: 0,
          wpm: 0,
          connected: true,
          identity,
          socketId: identity.id,
        };
        await save(redis, room);
        await redis.set(playerKey(identity.id), room.id, "EX", 900);
        await races.update(room.mongoId, { participantIds: Object.keys(room.players) });
        return room;
      });
    }
    const options = data.options || data;
    return matchmake(redis, identity.id, identity, { ...options, inviteCode: normalized });
  } catch {
    return null;
  }
}
