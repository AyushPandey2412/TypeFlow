import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config.js";
import { sessions } from "../repositories/session.repository.js";

export type RequestMeta = { userAgent?: string; ipAddress?: string };
export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
export function createAccessToken(subject: string, role: "user" | "guest", displayName: string) {
  return jwt.sign({ role, displayName }, env.JWT_ACCESS_SECRET, { subject, expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] });
}
export async function createRefreshSession(userId: string, meta: RequestMeta, familyId: string = randomUUID()) {
  const opaqueToken = randomBytes(48).toString("base64url");
  const tokenHash = hashToken(opaqueToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86_400_000);
  await sessions.create({ userId, tokenHash, familyId, expiresAt, userAgent: meta.userAgent, ipAddress: meta.ipAddress });
  return { tokenHash, refreshToken: jwt.sign({ token: opaqueToken, familyId }, env.JWT_REFRESH_SECRET, { subject: userId, expiresIn: `${env.REFRESH_TOKEN_DAYS}d` }) };
}
export function verifyRefreshToken(value: string) { return jwt.verify(value, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & { token: string; familyId: string }; }
