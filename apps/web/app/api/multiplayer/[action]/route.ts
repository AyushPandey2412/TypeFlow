import { NextRequest, NextResponse } from "next/server";
import { matchmakingSchema, progressSchema, socketCompletionSchema } from "../../../../../server/src/validators/race.validator.js";
import { validateRaceInvite } from "../../../../../server/src/services/friend.service.js";
import { getRedis } from "../../../../lib/redis";
import * as raceState from "../../../../lib/realtime-race";
import { apiError, authIdentity, connectDatabase, requireSameOrigin } from "../../../../lib/server-backend";
import { z } from "zod";

type Context = { params: Promise<{ action: string }> };

function response(room: raceState.StoredRoom) {
  return NextResponse.json({ race: raceState.publicRace(room), packet: room.packet, results: room.results });
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { action } = await context.params;
    if (action !== "state") return NextResponse.json({ error: "Not found" }, { status: 404 });
    const identity = authIdentity(request);
    const room = await raceState.getRoomState(getRedis(), identity.id, request.nextUrl.searchParams.get("raceId") || undefined);
    return room ? response(room) : NextResponse.json({ error: "Race not found" }, { status: 404 });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    requireSameOrigin(request);
    await connectDatabase();
    const { action } = await context.params;
    const identity = authIdentity(request);
    const redis = getRedis();
    if (action === "create-room") {
      const parsed = matchmakingSchema.omit({ inviteCode: true }).parse(await request.json());
      const created = await raceState.createPrivateRoom(redis, identity, parsed);
      return NextResponse.json({ race: raceState.publicRace(created.room), packet: created.room.packet, results: created.room.results, roomCode: created.code });
    }
    if (action === "join-room") {
      const { roomCode } = z.object({ roomCode: z.string().trim().length(6).transform(value => value.toUpperCase()) }).parse(await request.json());
      const room = await raceState.joinPrivateRoom(redis, identity, roomCode);
      return room ? response(room) : NextResponse.json({ error: "Room code is invalid or expired" }, { status: 404 });
    }
    if (action === "matchmake") {
      const parsed = matchmakingSchema.parse(await request.json());
      const invite = parsed.inviteCode ? await validateRaceInvite(parsed.inviteCode, identity.id) : null;
      const options = invite ? { ...invite.options, inviteCode: parsed.inviteCode } : parsed;
      return response(await raceState.matchmake(redis, identity.id, identity, options));
    }
    if (action === "progress") {
      const parsed = progressSchema.parse(await request.json());
      await raceState.updateProgress(redis, parsed.raceId, identity.id, parsed.typedText);
      const room = await raceState.getRoomState(redis, identity.id, parsed.raceId);
      return room ? response(room) : NextResponse.json({ error: "Race not found" }, { status: 404 });
    }
    if (action === "complete") {
      const parsed = socketCompletionSchema.parse(await request.json());
      const room = await raceState.complete(redis, parsed.raceId, identity.id, parsed.typedText, parsed.durationMs);
      return room ? response(room) : NextResponse.json({ error: "Race not found" }, { status: 404 });
    }
    if (action === "leave") {
      const room = await raceState.disconnect(redis, identity.id);
      return NextResponse.json({ race: room ? raceState.publicRace(room) : null });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) { return apiError(error); }
}
