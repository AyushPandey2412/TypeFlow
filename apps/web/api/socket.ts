import { createAdapter } from "@socket.io/redis-adapter";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { getRedis } from "../lib/redis";
import { registerVercelRaceNamespace } from "../lib/vercel-race-socket";

const server = createServer();
const io = new Server(server, { path: "/api/socket", cors: { origin: true, credentials: true } });
const pubClient = getRedis();
io.adapter(createAdapter(pubClient, pubClient.duplicate()));
registerVercelRaceNamespace(io, pubClient);

export default server;
