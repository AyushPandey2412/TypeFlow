import { NextRequest, NextResponse } from "next/server";
import { addFriend, listFriends } from "../../../../server/src/services/friend.service.js";
import { friendCodeSchema } from "../../../../server/src/validators/friend.validator.js";
import { apiError, connectDatabase, registeredUserId, requireSameOrigin } from "../../../lib/server-backend";

export async function GET(request: NextRequest) { try { await connectDatabase(); return NextResponse.json(await listFriends(registeredUserId(request))); } catch (error) { return apiError(error); } }
export async function POST(request: NextRequest) { try { requireSameOrigin(request); await connectDatabase(); const input = friendCodeSchema.parse(await request.json()); return NextResponse.json(await addFriend(registeredUserId(request), input.code), { status: 201 }); } catch (error) { return apiError(error); } }
