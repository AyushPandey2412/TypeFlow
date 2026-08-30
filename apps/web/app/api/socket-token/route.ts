import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const token = request.cookies.get("typing_access")?.value;
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  return NextResponse.json({ token }, { headers: { "cache-control": "no-store" } });
}
