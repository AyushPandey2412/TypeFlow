import { NextRequest, NextResponse } from "next/server";
import * as auth from "../../../../../server/src/services/auth.service.js";
import { credentialsSchema, registrationSchema } from "../../../../../server/src/validators/auth.validator.js";
import { apiError, connectDatabase, requestMeta, requireSameOrigin, secureCookie } from "../../../../lib/server-backend";

const refreshCookie = "typing_refresh";
const allowed = new Set(["register", "login", "refresh", "logout", "guest"]);

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  try {
    requireSameOrigin(request);
    const { action } = await context.params;
    if (!allowed.has(action)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await connectDatabase();
    if (action === "logout") {
      await auth.logout(request.cookies.get(refreshCookie)?.value);
      const response = new NextResponse(null, { status: 204 });
      response.cookies.delete("typing_access"); response.cookies.delete(refreshCookie);
      return response;
    }
    if (action === "guest") return sessionResponse(await auth.createGuest(), 201, false);
    const session = action === "refresh"
      ? await auth.refresh(request.cookies.get(refreshCookie)?.value || "", requestMeta(request))
      : action === "register"
        ? await auth.register(registrationSchema.parse(await request.json()), requestMeta(request))
        : await auth.login(credentialsSchema.parse(await request.json()), requestMeta(request));
    return sessionResponse(session, action === "register" ? 201 : 200, true);
  } catch (error) { return apiError(error); }
}

function sessionResponse(session: { user: unknown; accessToken: string; refreshToken?: string }, status: number, persistent: boolean) {
  const response = NextResponse.json({ user: session.user }, { status });
  response.cookies.set("typing_access", session.accessToken, { httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/", maxAge: 15 * 60 });
  if (persistent && session.refreshToken) response.cookies.set(refreshCookie, session.refreshToken, { httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/", maxAge: auth.refreshMaxAge / 1000 });
  return response;
}
