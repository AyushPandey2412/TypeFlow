import { Router } from "express";
import { leaderboard } from "../controllers/race.controller.js";
import * as controller from "../controllers/race.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
export const raceRouter=Router(); raceRouter.get("/leaderboard",leaderboard);raceRouter.get("/history",authenticate,controller.history);raceRouter.post("/solo",authenticate,controller.createSolo);raceRouter.post("/:id/start",authenticate,controller.beginSolo);raceRouter.post("/:id/extend",authenticate,controller.extendSoloPacket);raceRouter.post("/:id/complete",authenticate,controller.finishSolo);
