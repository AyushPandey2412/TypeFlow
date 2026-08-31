import { NextRequest, NextResponse } from "next/server";
import { createFriendInvite, friendStats, listInvites } from "../../../../../server/src/services/friend.service.js";
import { friendInviteSchema } from "../../../../../server/src/validators/friend.validator.js";
import { apiError, connectDatabase, registeredUserId, requireSameOrigin } from "../../../../lib/server-backend";

type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: NextRequest, context: Context) { try { await connectDatabase(); const { path } = await context.params; const userId = registeredUserId(request); if (path[0] === "invites") return NextResponse.json({ invites: await listInvites(userId) }); if (path[0] && path[1] === "stats") return NextResponse.json(await friendStats(userId, path[0])); return NextResponse.json({ error: "Not found" }, { status: 404 }); } catch (error) { return apiError(error); } }
export async function POST(request: NextRequest, context: Context) { try { requireSameOrigin(request); await connectDatabase(); const { path } = await context.params; if (path[0] && path[1] === "invite") return NextResponse.json(await createFriendInvite(registeredUserId(request), path[0], friendInviteSchema.parse(await request.json())), { status: 201 }); return NextResponse.json({ error: "Not found" }, { status: 404 }); } catch (error) { return apiError(error); } }
