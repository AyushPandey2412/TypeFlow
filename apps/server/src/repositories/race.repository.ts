import { Race, RaceResult } from "../models/index.js";

export const races = {
  create: (input: Record<string, unknown>) => Race.create(input),
  findById: (id: string) => Race.findById(id),
  update: (id: string, update: Record<string, unknown>) => Race.findByIdAndUpdate(id, update),
  sharedMultiplayer: (firstId:string,secondId:string) => Race.find({kind:"multiplayer",status:"finished",participantIds:{$all:[firstId,secondId]}}).sort({createdAt:-1}).lean(),
};

export const raceResults = {
  create: (input: Record<string, unknown>) => RaceResult.create(input),
  leaderboard: (limit: number) => RaceResult.find({ valid: true, userId: { $exists: true } }).sort({ correctWpm: -1, accuracy: -1, createdAt: 1 }).limit(limit).populate("userId", "username").lean(),
  history: (userId: string, limit: number) => RaceResult.find({ userId }).sort({ createdAt: -1 }).limit(limit).select("rawWpm correctWpm accuracy errors durationMs valid createdAt raceId").lean(),
  forRacesAndUsers: (raceIds:unknown[],userIds:string[]) => RaceResult.find({raceId:{$in:raceIds},userId:{$in:userIds},valid:true}).sort({createdAt:-1}).lean(),
};
