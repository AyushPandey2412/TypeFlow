import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const token = request.cookies.get("typing_access")?.value;
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const upstream = await fetch(`${process.env.API_URL || "http://localhost:5000"}/auth/me`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { "content-type": "application/json" } });
}
