import type { NextFunction, Request, Response } from "express";
import { getHistory, getLeaderboard } from "../services/leaderboard.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { completionSchema, raceOptionsSchema } from "../validators/race.validator.js";
import { completeSolo, extendSolo, issueSolo, startSolo } from "../services/solo-race.service.js";
export async function leaderboard(req: Request, res: Response, next: NextFunction) { try { const limit = Math.min(Math.max(Number(req.query.limit)||50,1),100); return res.json({ entries: await getLeaderboard(limit) }); } catch(error){ next(error); } }
export async function createSolo(req:Request,res:Response,next:NextFunction){try{return res.status(201).json(await issueSolo((req as AuthenticatedRequest).auth,raceOptionsSchema.parse(req.body)))}catch(error){next(error)}}
export async function beginSolo(req:Request,res:Response,next:NextFunction){try{return res.json(await startSolo((req as AuthenticatedRequest).auth,String(req.params.id)))}catch(error){next(error)}}
export async function extendSoloPacket(req:Request,res:Response,next:NextFunction){try{return res.json(await extendSolo((req as AuthenticatedRequest).auth,String(req.params.id)))}catch(error){next(error)}}
export async function finishSolo(req:Request,res:Response,next:NextFunction){try{const input=completionSchema.parse(req.body);return res.json(await completeSolo((req as AuthenticatedRequest).auth,String(req.params.id),input.typedText,input.durationMs))}catch(error){next(error)}}
export async function history(req:Request,res:Response,next:NextFunction){try{const identity=(req as AuthenticatedRequest).auth;return res.json({entries:identity.role==="guest"?[]:await getHistory(identity.id)})}catch(error){next(error)}}
