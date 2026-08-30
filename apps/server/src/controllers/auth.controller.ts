import type { NextFunction, Request, Response } from "express";
import { isProduction } from "../config.js";
import * as authService from "../services/auth.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { credentialsSchema, registrationSchema } from "../validators/auth.validator.js";

const cookieName = "typing_refresh";
const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: "lax" as const, path: "/" };
const meta = (req: Request) => ({ userAgent: req.get("user-agent"), ipAddress: req.ip });
const sendSession = (res: Response, session: Awaited<ReturnType<typeof authService.login>>, status = 200) => {
  res.cookie(cookieName, session.refreshToken, { ...cookieOptions, maxAge: authService.refreshMaxAge });
  return res.status(status).json({ user: session.user, accessToken: session.accessToken });
};

export async function register(req: Request, res: Response, next: NextFunction) { try { return sendSession(res, await authService.register(registrationSchema.parse(req.body), meta(req)), 201); } catch (error) { next(error); } }
export async function login(req: Request, res: Response, next: NextFunction) { try { return sendSession(res, await authService.login(credentialsSchema.parse(req.body), meta(req))); } catch (error) { next(error); } }
export async function refresh(req: Request, res: Response, next: NextFunction) { try { return sendSession(res, await authService.refresh(req.cookies?.[cookieName], meta(req))); } catch (error) { next(error); } }
export async function logout(req: Request, res: Response, next: NextFunction) { try { await authService.logout(req.cookies?.[cookieName]); res.clearCookie(cookieName, cookieOptions); return res.status(204).send(); } catch (error) { next(error); } }
export async function guest(_req: Request, res: Response, next: NextFunction) { try { return res.status(201).json(await authService.createGuest()); } catch (error) { next(error); } }
export async function me(req: Request, res: Response, next: NextFunction) { try { return res.json({ user: await authService.getCurrentUser((req as AuthenticatedRequest).auth) }); } catch (error) { next(error); } }
