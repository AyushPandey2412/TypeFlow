"use client";

import type { Player, Race, RaceMode, RaceResult, WordPacket } from "@typing/shared-types";
import { useEffect, useRef, useState } from "react";
import { raceService, type MultiplayerState } from "../services/race.service";
import { friendService } from "../services/friend.service";

type Props = { mode: RaceMode; wordCount: 25 | 50 | 100; playerCount?: 2 | 3; numbers: boolean; punctuation: boolean; inviteCode?: string; onClose: () => void };

export function Multiplayer({ mode, wordCount, playerCount = 3, numbers, punctuation, inviteCode, onClose }: Props) {
  const [race, setRace] = useState<Race | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [packet, setPacket] = useState<WordPacket | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const raceId = useRef("");
  const completed = useRef(false);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function applyState(value: MultiplayerState) {
    raceId.current = value.race.id;
    setRace(value.race);
    setPlayers(value.race.players);
    setPacket(value.packet);
    setResults(value.results);
    setError("");
  }

  useEffect(() => {
    let active = true;
    let poll: ReturnType<typeof setInterval> | undefined;
    raceService.matchmake({ mode, wordCount, playerCount, numbers, punctuation, inviteCode })
      .then(value => {
        if (!active) return;
        applyState(value);
        poll = setInterval(() => {
          if (!raceId.current) return;
          raceService.multiplayerState(raceId.current).then(applyState).catch(() => setError("Race connection was interrupted. Retrying..."));
        }, 1000);
      })
      .catch(errorValue => setError(errorValue instanceof Error ? errorValue.message : "Unable to connect to multiplayer."));
    return () => {
      active = false;
      if (poll) clearInterval(poll);
      if (progressTimer.current) clearTimeout(progressTimer.current);
      void raceService.leaveMultiplayer().catch(() => undefined);
      if (inviteCode) void friendService.respond(inviteCode, "cancel").catch(() => undefined);
    };
  }, [inviteCode, mode, numbers, playerCount, punctuation, wordCount]);

  const target = packet?.words.slice(0, wordCount).join(" ") || "";

  function type(value: string) {
    if (race?.status !== "running" || completed.current) return;
    const next = value.slice(0, target.length);
    setTyped(next);
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      if (raceId.current) void raceService.multiplayerProgress({ raceId: raceId.current, typedText: next }).then(applyState).catch(() => undefined);
    }, 200);
    if (next.length === target.length) {
      completed.current = true;
      const startsAt = race.startsAt ? new Date(race.startsAt).getTime() : Date.now();
      void raceService.completeMultiplayer({ raceId: race.id, typedText: next, durationMs: Math.max(1, Date.now() - startsAt) }).then(applyState).catch(() => setError("Unable to submit the race result."));
    }
  }

  return <div className="multiplayer">
    <div className="multiplayer-head">
      <div><h2>Live race</h2><p>{race?.status || "Finding players"} - starts with {playerCount} players or after 10 seconds</p></div>
      <button className="secondary" onClick={onClose}>Leave</button>
    </div>
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="player-list">{Array.from({ length: playerCount }, (_, index) => {
      const player = players[index];
      return <div className="player-row" key={index}>
        <div className="player-label"><span>{player?.displayName || "Waiting for player"}</span><span>{player?.wpm || 0} wpm</span></div>
        <div className="progress"><i style={{ width: `${player?.progress || 0}%` }} /></div>
      </div>;
    })}</div>
    {target && <div className="multiplayer-type">
      <div className="words">{[...target].map((char, index) => <span key={index} data-state={index < typed.length ? (typed[index] === char ? "correct" : "wrong") : index === typed.length ? "caret" : "upcoming"}>{char}</span>)}</div>
      <textarea aria-label="Multiplayer typing input" autoFocus value={typed} onPaste={event => event.preventDefault()} onChange={event => type(event.target.value)} disabled={race?.status !== "running"} />
    </div>}
    {results.length > 0 && <p>Race complete. Validated WPM: {results[0].correctWpm}</p>}
  </div>;
}
