import Redis from "ioredis";

class MemoryRedis {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ...args: (string | number)[]): Promise<string | null> {
    let expiresAt: number | undefined;
    let nx = false;

    for (let i = 0; i < args.length; i++) {
      const arg = String(args[i]).toUpperCase();
      if (arg === "EX" && typeof args[i + 1] === "number") {
        expiresAt = Date.now() + (args[i + 1] as number) * 1000;
        i++;
      } else if (arg === "PX" && typeof args[i + 1] === "number") {
        expiresAt = Date.now() + (args[i + 1] as number);
        i++;
      } else if (arg === "NX") {
        nx = true;
      }
    }

    if (nx) {
      const existing = await this.get(key);
      if (existing !== null) return null;
    }

    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async eval(script: string, numKeys: number, key: string, arg: string): Promise<number> {
    const current = await this.get(key);
    if (current === arg) {
      await this.del(key);
      return 1;
    }
    return 0;
  }
}

declare global { var typeflowRedis: Redis | MemoryRedis | undefined; }

export function getRedis(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    globalThis.typeflowRedis ??= new MemoryRedis();
    return globalThis.typeflowRedis as unknown as Redis;
  }
  globalThis.typeflowRedis ??= new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
  return globalThis.typeflowRedis as Redis;
}
