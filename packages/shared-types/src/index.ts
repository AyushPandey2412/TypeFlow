export type UserRole = "user" | "guest";
export type RaceMode = "normal" | "hard" | "medium";
export type RaceKind = "solo" | "multiplayer";
export type RaceStatus = "waiting" | "countdown" | "running" | "finished" | "cancelled";
export type TypingScoreInput = { target: string; typedText: string; durationMs: number };
export function calculateTypingScore({ target, typedText, durationMs }: TypingScoreInput) {
  const typed = typedText.slice(0, target.length); const targetWords = target.split(" "); const typedWords = typed.split(" "); const endsWithSpace = typed.endsWith(" ");
  let correct = 0; let incorrect = 0; let extra = 0; let missed = 0; let scoredCharacters = 0;
  typedWords.forEach((typedWord, index) => {
    const targetWord = targetWords[index] ?? ""; const submitted = index < typedWords.length - 1 || endsWithSpace;
    for (let position = 0; position < Math.min(typedWord.length, targetWord.length); position++) { if (typedWord[position] === targetWord[position]) correct++; else incorrect++; }
    extra += Math.max(0, typedWord.length - targetWord.length); if (submitted) missed += Math.max(0, targetWord.length - typedWord.length);
    if (typedWord === targetWord && (submitted || index === targetWords.length - 1)) scoredCharacters += targetWord.length + (submitted && index < targetWords.length - 1 ? 1 : 0);
    if (submitted && index < targetWords.length - 1) correct++;
  });
  const attempted = correct + incorrect + extra; const minutes = Math.max(durationMs, 1000) / 60000;
  return { rawWpm: Math.round(typed.length / 5 / minutes), correctWpm: Math.round(scoredCharacters / 5 / minutes), accuracy: attempted ? Math.round(correct / attempted * 100) : 100, errors: incorrect + extra + missed, progress: target.length ? Math.min(100, typed.length / target.length * 100) : 0, correctCharacters: correct, typedCharacters: typed.length, characterStats: { correct, incorrect, extra, missed } };
}

export interface AuthUser {
  id: string;
  displayName: string;
  email?: string;
  role: UserRole;
}

export interface Player {
  id: string;
  displayName: string;
  role: UserRole;
  progress: number;
  wpm: number;
  connected: boolean;
}

export interface WordPacket {
  id: string;
  seed: string;
  words: string[];
  mode: RaceMode;
  includeNumbers: boolean;
  includePunctuation: boolean;
  issuedAt: string;
}

export interface Race {
  id: string;
  kind: RaceKind;
  status: RaceStatus;
  wordPacket: WordPacket;
  players: Player[];
  startsAt?: string;
  endsAt?: string;
}

export interface RaceResult {
  raceId: string;
  playerId: string;
  rawWpm: number;
  correctWpm: number;
  accuracy: number;
  errors: number;
  durationMs: number;
  valid: boolean;
}

export interface ClientToServerEvents {
  "race:matchmake": (payload: { mode: RaceMode; wordCount: 25 | 50 | 100; numbers: boolean; punctuation: boolean; inviteCode?: string }) => void;
  "race:progress": (payload: { raceId: string; typedText: string }) => void;
  "race:complete": (payload: { raceId: string; typedText: string; durationMs: number }) => void;
  "race:leave": (payload: { raceId: string }) => void;
}

export interface ServerToClientEvents {
  "race:state": (race: Race) => void;
  "race:packet": (packet: WordPacket) => void;
  "race:player-progress": (player: Player) => void;
  "race:results": (results: RaceResult[]) => void;
  "race:error": (error: { code: string; message: string }) => void;
}
