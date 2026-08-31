import Redis from "ioredis";

declare global { var typeflowRedis: Redis | undefined; }

export function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required for multiplayer");
  globalThis.typeflowRedis ??= new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
  return globalThis.typeflowRedis;
}
