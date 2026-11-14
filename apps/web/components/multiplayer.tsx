"use client";

import type { Player, Race, RaceMode, RaceResult, WordPacket } from "@typing/shared-types";
import { useEffect, useRef, useState } from "react";
import { raceService, type MultiplayerState } from "../services/race.service";
import { friendService } from "../services/friend.service";
import { useAuth } from "../stores/auth";
import { Copy, Play, Square, Users, LogOut } from "lucide-react";

type Props = {
  mode: RaceMode;
  wordCount: 25 | 50 | 100;
  playerCount?: 2 | 3;
  numbers: boolean;
  punctuation: boolean;
  inviteCode?: string;
  roomMode?: "create" | "join";
  roomCode?: string;
  onClose: () => void;
};

export function Multiplayer({
  mode,
  wordCount,
  playerCount = 3,
  numbers,
  punctuation,
  inviteCode,
  roomMode,
  roomCode: requestedRoomCode,
  onClose,
}: Props) {
  const user = useAuth(s => s.user);
  const [race, setRace] = useState<Race | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [packet, setPacket] = useState<WordPacket | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [roomCode, setRoomCode] = useState(requestedRoomCode || "");
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const raceId = useRef("");
  const completed = useRef(false);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isHost = race ? (race.hostId ? race.hostId === user?.id : players[0]?.id === user?.id) : false;

  function applyState(value: MultiplayerState) {
    raceId.current = value.race.id;
    setRace(value.race);
    setPlayers(value.race.players);
    setPacket(prev => (prev?.id === value.packet.id ? prev : value.packet));
    setResults(value.results);
    if ("roomCode" in value.race && typeof value.race.roomCode === "string") {
      setRoomCode(value.race.roomCode);
    }
    setError("");
  }

  useEffect(() => {
    let active = true;
    let poll: ReturnType<typeof setInterval> | undefined;
    const request =
      roomMode === "create"
        ? raceService.createPrivateRoom({ mode, wordCount, playerCount, numbers, punctuation })
        : roomMode === "join"
        ? raceService.joinPrivateRoom(requestedRoomCode || "")
        : raceService.matchmake({ mode, wordCount, playerCount, numbers, punctuation, inviteCode });

    request
      .then(value => {
        if (!active) return;
        if ("roomCode" in value && typeof value.roomCode === "string") setRoomCode(value.roomCode);
        applyState(value);
        poll = setInterval(() => {
          if (!raceId.current) return;
          raceService
            .multiplayerState(raceId.current)
            .then(applyState)
            .catch(() => setError("Race connection was interrupted. Retrying..."));
        }, 1000);
      })
      .catch(errorValue => setError(errorValue instanceof Error ? errorValue.message : "Unable to connect to multiplayer."));

    return () => {
      active = false;
      if (poll) clearInterval(poll);
      if (progressTimer.current) clearTimeout(progressTimer.current);
      void raceService.leaveMultiplayer().catch(() => undefined);
    };
  }, [inviteCode, mode, numbers, playerCount, punctuation, requestedRoomCode, roomMode, wordCount]);

  // Countdown timer synchronization
  useEffect(() => {
    if (race?.status !== "countdown" || !race.startsAt) {
      setCountdownSec(null);
      return;
    }

    const targetTime = new Date(race.startsAt).getTime();
    const tick = () => {
      const remainingMs = targetTime - Date.now();
      const sec = Math.ceil(remainingMs / 1000);
      if (sec <= 0) {
        setCountdownSec(0);
      } else {
        setCountdownSec(sec);
      }
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [race?.status, race?.startsAt]);

  const isRaceRunning =
    race?.status === "running" ||
    (race?.status === "countdown" && !!race.startsAt && Date.now() >= new Date(race.startsAt).getTime());

  // Auto focus input when race becomes active
  useEffect(() => {
    if (isRaceRunning && !completed.current) {
      textareaRef.current?.focus();
    }
  }, [isRaceRunning]);

  const target = packet?.words.slice(0, wordCount).join(" ") || "";

  function type(value: string) {
    if (!isRaceRunning || completed.current) return;
    const next = value.slice(0, target.length);
    setTyped(next);
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      if (raceId.current) void raceService.multiplayerProgress({ raceId: raceId.current, typedText: next }).then(applyState).catch(() => undefined);
    }, 200);

    if (next.length === target.length) {
      completed.current = true;
      const startsAt = race?.startsAt ? new Date(race.startsAt).getTime() : Date.now();
      void raceService
        .completeMultiplayer({ raceId: raceId.current, typedText: next, durationMs: Math.max(1, Date.now() - startsAt) })
        .then(applyState)
        .catch(() => setError("Unable to submit the race result."));
    }
  }

  async function handleStart() {
    if (!raceId.current) return;
    setActionLoading(true);
    setError("");
    try {
      const state = await raceService.startMultiplayer(raceId.current);
      applyState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start the race.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStop() {
    if (!raceId.current) return;
    setActionLoading(true);
    setError("");
    try {
      const state = await raceService.stopMultiplayer(raceId.current);
      applyState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to stop the race.");
    } finally {
      setActionLoading(false);
    }
  }

  const statusDescription = () => {
    if (!race) return "Connecting to room...";
    if (race.status === "waiting") {
      if (isHost) {
        if (players.length < 2) {
          return "Waiting for players to join... Share your room code or wait for your friend.";
        }
        return "Players ready! Press Start Race to begin.";
      }
      return "Joined room. Waiting for the host to start the race...";
    }
    if (race.status === "countdown") {
      return "Get ready! The race is about to begin.";
    }
    if (race.status === "running") {
      return "Race is active! Type as fast and accurately as possible.";
    }
    if (race.status === "cancelled") {
      return "This race was stopped or cancelled.";
    }
    if (race.status === "finished") {
      return "Race finished!";
    }
    return race.status;
  };

  return (
    <div className="multiplayer">
      <div className="multiplayer-head">
        <div>
          <h2>Live Race</h2>
          <p className="race-status-text">{statusDescription()}</p>
          {roomCode && (
            <button
              className="room-code"
              title="Copy room code"
              onClick={() => {
                void navigator.clipboard.writeText(roomCode);
                setNotice("Room code copied to clipboard!");
                setTimeout(() => setNotice(""), 3000);
              }}
            >
              Room code <strong>{roomCode}</strong> · <Copy size={13} style={{ display: "inline", verticalAlign: "middle" }} /> copy
            </button>
          )}
          {notice && <span style={{ color: "var(--accent)", fontSize: "12px", marginLeft: "10px" }}>{notice}</span>}
        </div>

        <div className="multiplayer-actions">
          {race?.status === "waiting" && isHost && (
            <button
              className="primary"
              onClick={handleStart}
              disabled={players.length < 2 || actionLoading}
              title={players.length < 2 ? "Waiting for at least one more player to join" : "Start the race for everyone"}
            >
              <Play size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "5px" }} />
              Start Race
            </button>
          )}

          {(race?.status === "countdown" || race?.status === "running") && isHost && (
            <button
              className="secondary danger-btn"
              onClick={handleStop}
              disabled={actionLoading}
              title="Stop the race"
            >
              <Square size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "5px" }} />
              Stop Race
            </button>
          )}

          <button className="secondary" onClick={onClose} title="Leave room">
            <LogOut size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "5px" }} />
            Leave
          </button>
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert" style={{ marginTop: "12px" }}>
          {error}
        </div>
      )}

      {race?.status === "countdown" && countdownSec !== null && (
        <div className="countdown-banner" aria-live="assertive">
          {countdownSec <= 0 ? "GO!" : `Starting in ${countdownSec}...`}
        </div>
      )}

      <div className="player-list">
        {Array.from({ length: Math.max(playerCount, players.length) }, (_, index) => {
          const player = players[index];
          const isPlayerHost = player && race && (race.hostId ? race.hostId === player.id : index === 0);
          const isCurrentPlayer = player && user && player.id === user.id;

          return (
            <div className="player-row" key={index}>
              <div className="player-label">
                <span>
                  {player?.displayName || "Waiting for player..."}
                  {isPlayerHost && <span className="host-badge">Host</span>}
                  {isCurrentPlayer && <span className="you-badge">You</span>}
                  {player && !player.connected && <span style={{ color: "#ef6b73", fontSize: "11px", marginLeft: "6px" }}>(disconnected)</span>}
                </span>
                <span>{player?.wpm || 0} wpm</span>
              </div>
              <div className="progress">
                <i style={{ width: `${player?.progress || 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {target && (
        <div className="multiplayer-type">
          <div className="words">
            {[...target].map((char, index) => (
              <span
                key={index}
                data-state={
                  index < typed.length
                    ? typed[index] === char
                      ? "correct"
                      : "wrong"
                    : index === typed.length
                    ? "caret"
                    : "upcoming"
                }
              >
                {char}
              </span>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            aria-label="Multiplayer typing input"
            autoFocus
            value={typed}
            onPaste={event => event.preventDefault()}
            onKeyDown={event => {
              if (event.key === "Tab" || event.key === "Enter") {
                event.preventDefault();
              }
            }}
            onChange={event => type(event.target.value)}
            disabled={!isRaceRunning || completed.current}
            placeholder={!isRaceRunning ? (race?.status === "waiting" ? "Waiting for race to start..." : "Get ready...") : ""}
          />
        </div>
      )}

      {results.length > 0 && (
        <div className="multiplayer-results">
          <h3>Race Results</h3>
          <div className="results-table">
            {results.map((result, idx) => {
              const matchedPlayer = players.find(p => p.id === result.playerId);
              return (
                <div className="result-row" key={result.playerId}>
                  <strong>#{idx + 1}</strong>
                  <span>{matchedPlayer?.displayName || result.playerId}</span>
                  <b>{result.correctWpm} WPM</b>
                  <span>{result.accuracy}% acc</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
