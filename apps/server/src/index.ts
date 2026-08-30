import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { env } from "./config.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { raceRouter } from "./routes/race.routes.js";
import { friendRouter } from "./routes/friend.routes.js";
import { registerRaceNamespace } from "./socket/race.socket.js";

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use("/auth", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false }), authRouter);
app.use("/races", raceRouter);
app.use("/friends", friendRouter);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use(errorHandler);

async function start() {
  await mongoose.connect(env.MONGO_URI);
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: env.FRONTEND_URL, credentials: true } });
  registerRaceNamespace(io);
  httpServer.listen(env.PORT, () => console.log(`Server listening on http://localhost:${env.PORT}`));
}

start().catch(error => {
  console.error("Server startup failed", error);
  process.exitCode = 1;
});
