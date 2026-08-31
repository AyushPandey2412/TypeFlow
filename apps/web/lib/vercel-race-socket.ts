import type { ClientToServerEvents, ServerToClientEvents } from "@typing/shared-types";
import jwt from "jsonwebtoken";
import type Redis from "ioredis";
import type { Server } from "socket.io";
import { env } from "../../server/src/config.js";
import { validateRaceInvite } from "../../server/src/services/friend.service.js";
import { matchmakingSchema, progressSchema, socketCompletionSchema } from "../../server/src/validators/race.validator.js";
import { connectDatabase } from "./server-backend";
import * as state from "./realtime-race";

export function registerVercelRaceNamespace(io: Server<ClientToServerEvents, ServerToClientEvents>, redis: Redis) {
  const race = io.of("/race");
  race.use(async (socket, next) => {
    try { await connectDatabase(); const payload = jwt.verify(socket.handshake.auth.token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & { role: "user" | "guest"; displayName: string }; socket.data.identity = { id: payload.sub!, role: payload.role, displayName: payload.displayName }; next(); }
    catch { next(new Error("unauthorized")); }
  });
  race.on("connection", socket => {
    socket.on("race:matchmake", async options => {
      try {
        const parsed = matchmakingSchema.parse(options); const invite = parsed.inviteCode ? await validateRaceInvite(parsed.inviteCode, socket.data.identity.id) : null; const matchOptions = invite ? { ...invite.options, inviteCode: parsed.inviteCode } : parsed;
        const room = await state.matchmake(redis, socket.id, socket.data.identity, matchOptions); socket.join(room.id); race.to(room.id).emit("race:state", state.publicRace(room)); socket.emit("race:packet", room.packet);
        const launch = async () => { const countdown = await state.begin(redis, room.id); if (!countdown || countdown.status !== "countdown") return; race.to(room.id).emit("race:state", state.publicRace(countdown)); setTimeout(async () => { const running = await state.markRunning(redis, room.id); if (!running || running.status !== "running") return; race.to(room.id).emit("race:state", state.publicRace(running)); setTimeout(async () => { const finished = await state.expire(redis, room.id); if (finished) { race.to(room.id).emit("race:state", state.publicRace(finished)); race.to(room.id).emit("race:results", finished.results); } }, 130_000); }, 3000); };
        if (Object.keys(room.players).length >= room.maxPlayers) void launch(); else setTimeout(() => void launch(), Math.max(0, room.createdAt + 10_000 - Date.now()));
      } catch { socket.emit("race:error", { code: "MATCHMAKE_FAILED", message: "Unable to join a race" }); }
    });
    socket.on("race:progress", async payload => { const parsed = progressSchema.safeParse(payload); if (!parsed.success) return; const player = await state.updateProgress(redis, parsed.data.raceId, socket.data.identity.id, parsed.data.typedText); if (player) race.to(parsed.data.raceId).emit("race:player-progress", player); });
    socket.on("race:complete", async payload => { const parsed = socketCompletionSchema.safeParse(payload); if (!parsed.success) return socket.emit("race:error", { code: "INVALID_RESULT", message: "Invalid race result" }); const room = await state.complete(redis, parsed.data.raceId, socket.data.identity.id, parsed.data.typedText, parsed.data.durationMs); if (!room) return socket.emit("race:error", { code: "RACE_NOT_FOUND", message: "Race is no longer active" }); race.to(room.id).emit("race:results", room.results); race.to(room.id).emit("race:state", state.publicRace(room)); });
    socket.on("race:leave", async () => { const room = await state.disconnect(redis, socket.data.identity.id); if (room) race.to(room.id).emit("race:state", state.publicRace(room)); });
    socket.on("disconnect", async () => { const room = await state.disconnect(redis, socket.data.identity.id); if (room) race.to(room.id).emit("race:state", state.publicRace(room)); });
  });
}
