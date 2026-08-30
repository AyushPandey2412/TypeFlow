import { NextRequest, NextResponse } from "next/server";

const allowed = new Set(["register", "login", "refresh", "logout", "guest"]);

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { action } = await context.params;
  if (!allowed.has(action)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let upstream: Response;
  try { upstream = await fetch(`${process.env.API_URL || "http://localhost:5000"}/auth/${action}`, {
    method: "POST", headers: { "content-type": "application/json", cookie: request.headers.get("cookie") || "" }, body: action === "refresh" || action === "logout" || action === "guest" ? "{}" : await request.text(), cache: "no-store",
  }); } catch { return NextResponse.json({ error: "Authentication server is unavailable" }, { status: 503 }); }
  const text = upstream.status === 204 ? "" : await upstream.text();
  let body: Record<string, unknown> = {}; try { body = text ? JSON.parse(text) : {}; } catch { body = { error: "Invalid upstream response" }; }
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : undefined; delete body.accessToken;
  const response = upstream.status === 204 ? new NextResponse(null, { status: 204 }) : NextResponse.json(body, { status: upstream.status });
  if (accessToken) response.cookies.set("typing_access", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 15 * 60 });
  if (action === "logout") response.cookies.delete("typing_access");
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}
