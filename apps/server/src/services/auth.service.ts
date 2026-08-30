import { randomBytes, randomUUID } from "node:crypto";
import argon2 from "argon2";
import bcrypt from "bcryptjs";
import { env } from "../config.js";
import { HttpError } from "../lib/http-error.js";
import { GuestSession } from "../models/index.js";
import { createAccessToken, createRefreshSession, hashToken, type RequestMeta, verifyRefreshToken } from "./token.service.js";
import type { AuthIdentity } from "../middleware/auth.middleware.js";
import { users } from "../repositories/user.repository.js";
import { sessions } from "../repositories/session.repository.js";

export type Credentials = { username: string; password: string };
export type Registration = Credentials & { email: string };
const publicUser = (user: any) => ({ id: String(user._id), displayName: user.username, email: user.email, role: user.role || "user" });
async function authenticatedSession(user: any, meta: RequestMeta, familyId?: string) {
  const refresh = await createRefreshSession(String(user._id), meta, familyId);
  return { user: publicUser(user), accessToken: createAccessToken(String(user._id), "user", user.username), ...refresh };
}

export async function register(input: Registration, meta: RequestMeta) {
  if (await users.existsByUsernameOrEmail(input.username,input.email)) throw new HttpError(409, "Username or email already exists");
  const password = await argon2.hash(input.password, { type: argon2.argon2id });
  return authenticatedSession(await users.create({ ...input, password }), meta);
}
export async function login(input: Credentials, meta: RequestMeta) {
  const user = await users.findByUsername(input.username);
  if (!user) throw new HttpError(401, "Invalid credentials");
  const legacy = !user.password.startsWith("$argon2");
  const valid = legacy ? await bcrypt.compare(input.password, user.password) : await argon2.verify(user.password, input.password);
  if (!valid) throw new HttpError(401, "Invalid credentials");
  if (legacy) { user.password = await argon2.hash(input.password, { type: argon2.argon2id }); await user.save(); }
  return authenticatedSession(user, meta);
}
export async function refresh(encoded: string, meta: RequestMeta) {
  if (!encoded) throw new HttpError(401, "Refresh token required");
  let payload; try { payload = verifyRefreshToken(encoded); } catch { throw new HttpError(401, "Invalid refresh token"); }
  const current = await sessions.findByTokenHash(hashToken(payload.token));
  if (!current) throw new HttpError(401, "Invalid refresh token");
  if (current.revokedAt || current.expiresAt <= new Date()) { await sessions.revokeFamily(current.familyId); throw new HttpError(401, "Refresh token reuse detected"); }
  const user = await users.findById(payload.sub!);
  if (!user) throw new HttpError(401, "User no longer exists");
  current.revokedAt = new Date();
  const next = await authenticatedSession(user, meta, current.familyId);
  current.replacedByHash = next.tokenHash;
  await current.save();
  return next;
}
export async function logout(encoded?: string) {
  if (!encoded) return;
  try { const payload = verifyRefreshToken(encoded); await sessions.revokeToken(hashToken(payload.token)); } catch { /* Invalid cookies are cleared by the controller. */ }
}
export async function createGuest() {
  const sessionId = randomUUID();
  const displayName = `Guest-${randomBytes(2).toString("hex").toUpperCase()}`;
  await GuestSession.create({ sessionId, displayName, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) });
  return { user: { id: sessionId, displayName, role: "guest" as const }, accessToken: createAccessToken(sessionId, "guest", displayName) };
}
export async function getCurrentUser(identity: AuthIdentity) {
  if (identity.role === "guest") return { id: identity.id, displayName: identity.displayName, role: "guest" as const };
  const user = await users.findById(identity.id); if (!user) throw new HttpError(401, "User no longer exists"); return publicUser(user);
}
export const refreshMaxAge = env.REFRESH_TOKEN_DAYS * 86_400_000;
