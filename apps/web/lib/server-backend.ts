import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "../../server/src/config.js";
import { HttpError } from "../../server/src/lib/http-error.js";
import type { AuthIdentity } from "../../server/src/middleware/auth.middleware.js";

declare global { var typeflowMongoConnection: Promise<typeof mongoose> | undefined; }

export function connectDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  globalThis.typeflowMongoConnection ??= mongoose.connect(env.MONGO_URI, { maxPoolSize: 10 });
  return globalThis.typeflowMongoConnection.catch(error => { globalThis.typeflowMongoConnection = undefined; throw error; });
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) throw new HttpError(403, "Invalid request origin");
}

export const requestMeta = (request: NextRequest) => ({ userAgent: request.headers.get("user-agent") || undefined, ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });

export function authIdentity(request: NextRequest): AuthIdentity {
  const token = request.cookies.get("typing_access")?.value;
  if (!token) throw new HttpError(401, "Access token required");
  try { const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & { role: "user" | "guest"; displayName: string }; return { id: payload.sub!, role: payload.role, displayName: payload.displayName }; }
  catch { throw new HttpError(401, "Invalid access token"); }
}

export function registeredUserId(request: NextRequest) { const identity = authIdentity(request); if (identity.role !== "user") throw new HttpError(403, "Registered account required"); return identity.id; }

export function apiError(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Invalid request" }, { status: 400 });
  console.error("API request failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export const secureCookie = process.env.NODE_ENV === "production";
