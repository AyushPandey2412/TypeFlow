import { NextRequest, NextResponse } from "next/server";
import { getHistory, getLeaderboard } from "../../../../../server/src/services/leaderboard.service.js";
import { completeSolo, extendSolo, issueSolo, startSolo } from "../../../../../server/src/services/solo-race.service.js";
import { completionSchema, raceOptionsSchema } from "../../../../../server/src/validators/race.validator.js";
import { apiError, authIdentity, connectDatabase, requireSameOrigin } from "../../../../lib/server-backend";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    await connectDatabase();
    const { path } = await context.params;
    if (path[0] === "leaderboard") { const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 50, 1), 100); return NextResponse.json({ entries: await getLeaderboard(limit) }); }
    if (path[0] === "history") { const identity = authIdentity(request); return NextResponse.json({ entries: identity.role === "guest" ? [] : await getHistory(identity.id) }); }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    requireSameOrigin(request); await connectDatabase();
    const { path } = await context.params; const identity = authIdentity(request);
    if (path[0] === "solo" && path.length === 1) return NextResponse.json(await issueSolo(identity, raceOptionsSchema.parse(await request.json())), { status: 201 });
    const [id, action] = path;
    if (!id || !action) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (action === "start") return NextResponse.json(await startSolo(identity, id));
    if (action === "extend") return NextResponse.json(await extendSolo(identity, id));
    if (action === "complete") { const input = completionSchema.parse(await request.json()); return NextResponse.json(await completeSolo(identity, id, input.typedText, input.durationMs)); }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) { return apiError(error); }
}
