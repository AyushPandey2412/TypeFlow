import { randomUUID } from "node:crypto";
import { generateWords } from "@typing/word-lists";
import type { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import type { AuthIdentity } from "../middleware/auth.middleware.js";
import { races, raceResults } from "../repositories/race.repository.js";
import type { raceOptionsSchema } from "../validators/race.validator.js";
import { calculateScore } from "./scoring.service.js";

export async function issueSolo(identity: AuthIdentity, options: z.infer<typeof raceOptionsSchema>) {
  const seed = randomUUID();
  const words = generateWords({ seed, count: options.timed ? 400 : options.wordCount, list: options.mode === "hard" ? "hard" : "common", numbers: options.numbers, punctuation: options.punctuation });
  const packet = { packetId: randomUUID(), seed, words, mode: options.mode, includeNumbers: options.numbers, includePunctuation: options.punctuation };
  const race = await races.create({ kind: "solo", status: "waiting", wordPacket: packet, participantIds: [identity.id] });
  return { raceId: String(race._id), wordPacket: { id: packet.packetId, ...packet, issuedAt: new Date().toISOString() } };
}
export async function startSolo(identity: AuthIdentity, raceId: string) {
  const race: any = await races.findById(raceId);
  if (!race || race.kind !== "solo" || !race.participantIds.includes(identity.id)) throw new HttpError(404, "Solo race not found");
  if (race.status === "waiting") {
    race.status = "running";
    race.startsAt = new Date();
    await race.save();
  }
  if (race.status !== "running") throw new HttpError(409, "Solo race is no longer active");
  return { startsAt: race.startsAt.toISOString() };
}
export async function extendSolo(identity: AuthIdentity, raceId: string) {
  const race: any = await races.findById(raceId);
  if (!race || race.kind !== "solo" || !["waiting", "running"].includes(race.status) || !race.participantIds.includes(identity.id)) throw new HttpError(404, "Active solo race not found");
  const currentCount = race.wordPacket.words.length;
  const nextCount = Math.min(currentCount + 400, 2400);
  if (nextCount > currentCount) {
    race.wordPacket.words = generateWords({ seed: race.wordPacket.seed, count: nextCount, list: race.wordPacket.mode === "hard" ? "hard" : "common", numbers: race.wordPacket.includeNumbers, punctuation: race.wordPacket.includePunctuation });
    race.markModified("wordPacket.words");
    await race.save();
  }
  return { words: race.wordPacket.words };
}
export async function completeSolo(identity: AuthIdentity, raceId: string, typedText: string, durationMs: number) {
  const race: any = await races.findById(raceId);
  if (!race || race.kind !== "solo" || race.status !== "running" || !race.participantIds.includes(identity.id)) throw new HttpError(404, "Active solo race not found");
  const serverDuration = Date.now() - new Date(race.startsAt).getTime();
  const score = calculateScore({ target: race.wordPacket.words.join(" "), typedText, durationMs });
  const valid = Math.abs(serverDuration - durationMs) < 5000;
  race.status = "finished"; race.endsAt = new Date(); await race.save();
  if (valid && identity.role === "user") await raceResults.create({ raceId: race._id, userId: identity.id, ...score, valid, durationMs });
  return { ...score, valid, durationMs };
}
