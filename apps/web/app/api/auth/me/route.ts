import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../server/src/services/auth.service.js";
import { apiError, authIdentity, connectDatabase } from "../../../../lib/server-backend";

export async function GET(request: NextRequest) {
  try { await connectDatabase(); return NextResponse.json({ user: await getCurrentUser(authIdentity(request)) }); }
  catch (error) { return apiError(error); }
}
