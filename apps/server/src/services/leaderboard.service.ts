import { raceResults } from "../repositories/race.repository.js";
export async function getLeaderboard(limit = 50) {
  const rows = await raceResults.leaderboard(limit);
  return rows.map((row: any, index) => ({ rank: index + 1, displayName: row.userId?.username || "Deleted user", correctWpm: row.correctWpm, rawWpm: row.rawWpm, accuracy: row.accuracy, createdAt: row.createdAt }));
}
export async function getHistory(userId:string,limit=50){return raceResults.history(userId,limit);}
