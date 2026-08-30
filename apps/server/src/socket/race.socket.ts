import type { ClientToServerEvents, ServerToClientEvents } from "@typing/shared-types";
import jwt from "jsonwebtoken";
import type { Server } from "socket.io";
import { env } from "../config.js";
import * as races from "../services/race.service.js";
import { matchmakingSchema, progressSchema, socketCompletionSchema } from "../validators/race.validator.js";
import { validateRaceInvite } from "../services/friend.service.js";

export function registerRaceNamespace(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  const race = io.of("/race");
  race.use((socket, next) => {
    try { const token = socket.handshake.auth.token; const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & { role: "user" | "guest"; displayName: string }; socket.data.identity = { id: payload.sub!, role: payload.role, displayName: payload.displayName }; next(); }
    catch { next(new Error("unauthorized")); }
  });
  race.on("connection", socket => {
    socket.on("race:matchmake", async options => {
      try {
        const parsed=matchmakingSchema.parse(options);const invite=parsed.inviteCode?await validateRaceInvite(parsed.inviteCode,socket.data.identity.id):null;const matchOptions=invite?{...invite.options,inviteCode:parsed.inviteCode}:parsed;
        const room = await races.matchmake(socket.id, socket.data.identity, matchOptions); socket.join(room.id); race.to(room.id).emit("race:state", races.publicRace(room)); socket.emit("race:packet", room.packet);
        const begin = () => { if (room.status !== "waiting") return; races.start(room); race.to(room.id).emit("race:state", races.publicRace(room)); setTimeout(() => { races.markRunning(room); races.armExpiry(room,()=>{race.to(room.id).emit("race:state",races.publicRace(room));race.to(room.id).emit("race:results",room.results);}); race.to(room.id).emit("race:state", races.publicRace(room)); }, 3000); };
        if (room.players.size === room.maxPlayers) begin(); else if (!room.inviteCode&&!room.timer) room.timer = setTimeout(begin, 10000);
      } catch { socket.emit("race:error", { code: "MATCHMAKE_FAILED", message: "Unable to join a race" }); }
    });
    socket.on("race:progress", payload => { const parsed=progressSchema.safeParse(payload);if(!parsed.success)return;const {raceId,typedText}=parsed.data; const room = races.getRoom(raceId); if (!room) return; const player = races.updateProgress(room, socket.id, typedText); if (player) race.to(room.id).emit("race:player-progress", player); });
    socket.on("race:complete", async payload => {
      const parsed=socketCompletionSchema.safeParse(payload);if(!parsed.success)return socket.emit("race:error",{code:"INVALID_RESULT",message:"Invalid race result"});const {raceId,typedText,durationMs}=parsed.data;
      const room = races.getRoom(raceId); if (!room) return socket.emit("race:error", { code: "RACE_NOT_FOUND", message: "Race is no longer active" });
      const player = room.players.get(socket.id); if (!player) return; await races.complete(room, player, typedText, durationMs); race.to(room.id).emit("race:results", room.results);
    });
    socket.on("race:leave", () => { const room=races.remove(socket.id);if(room)race.to(room.id).emit("race:state",races.publicRace(room)); }); socket.on("disconnect", () => {const room=races.remove(socket.id);if(room)race.to(room.id).emit("race:state",races.publicRace(room));});
  });
}
