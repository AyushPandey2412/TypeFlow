import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config.js";

export type AuthIdentity = { id: string; role: "user" | "guest"; displayName: string };
export type AuthenticatedRequest = Request & { auth: AuthIdentity };

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Access token required" });
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & { role: "user" | "guest"; displayName: string };
    (req as AuthenticatedRequest).auth = { id: payload.sub!, role: payload.role, displayName: payload.displayName };
    return next();
  } catch { return res.status(401).json({ error: "Invalid access token" }); }
}
