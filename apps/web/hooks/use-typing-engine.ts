"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateTypingScore } from "@typing/shared-types";

export function useTypingEngine(words: string[], seconds = 30, strict = false, kind: "time" | "words" = "time", resetKey = "") {
  const target = useMemo(() => words.join(" "), [words]);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [history, setHistory] = useState<{ second: number; wpm: number; raw: number; errors: number }[]>([]);
  const lockedLength = useRef(0);
  const lastSample = useRef(0);
  const lastSampleLength = useRef(0);
  const elapsedMs = startedAt ? Math.max(0, now - startedAt) : 0;
  const elapsedSecond = Math.floor(elapsedMs / 1000);
  const remaining = kind === "time" ? Math.max(0, seconds - elapsedSecond) : elapsedSecond;
  const score = calculateTypingScore({ target, typedText: typed, durationMs: elapsedMs });
  const { rawWpm, correctWpm: wpm, accuracy, errors, characterStats } = score;
  const typedWords=typed.split(" ");const targetWords=target.split(" ");const finished = kind === "time" ? elapsedMs >= seconds * 1000 : target.length > 0 && typedWords.length>=targetWords.length&&typedWords[targetWords.length-1].length>=targetWords[targetWords.length-1].length;
  const running = startedAt !== null && !finished;

  const reset = useCallback(() => {
    setTyped(""); setStartedAt(null); setNow(0); setHistory([]); lockedLength.current = 0; lastSample.current = 0; lastSampleLength.current = 0;
  }, []);
  useEffect(reset, [reset, resetKey, seconds]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (!startedAt || elapsedSecond < 1 || elapsedSecond === lastSample.current) return;
    lastSample.current = elapsedSecond;
    const raw = Math.max(0, Math.round((typed.length-lastSampleLength.current)/5*60));
    lastSampleLength.current=typed.length;
    setHistory(value => [...value, { second: elapsedSecond, wpm, raw, errors }]);
  }, [elapsedSecond, errors, startedAt, typed.length, wpm]);

  const input = useCallback((value: string) => {
    if (finished) return;
    if (!startedAt) { const time = Date.now(); setStartedAt(time); setNow(time); }
    if (strict && value.length < lockedLength.current) return;
    if (strict && value.endsWith(" ")) lockedLength.current = value.length;
    setTyped(value.slice(0, 20_000));
  }, [finished, startedAt, strict]);

  const rawSamples=history.map(value=>value.raw).filter(value=>value>0);const rawMean=rawSamples.length?rawSamples.reduce((sum,value)=>sum+value,0)/rawSamples.length:0;const deviation=rawSamples.length?Math.sqrt(rawSamples.reduce((sum,value)=>sum+(value-rawMean)**2,0)/rawSamples.length):0;const consistency=rawMean?Math.max(0,Math.round(100-deviation/rawMean*100)):100;
  return { target, typed, input, reset, remaining, elapsedMs, rawWpm, wpm, accuracy, errors, characterStats, consistency, history, finished, running, progress: target.length ? typed.length / target.length * 100 : 0 };
}
