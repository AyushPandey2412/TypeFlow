"use client";
import { Check, ChevronLeft, ChevronRight, CircleDot, Hand, Keyboard, LockKeyhole, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Brand } from "../../components/brand";
import { apiRequest } from "../../services/api-client";
import { useAuth } from "../../stores/auth";
import { beginnerLessons, fingerLabels, fingersForExpectedKey, keyLabel, type TeachingStep } from "./course";
import { buildPracticeTarget, isMastered, masteryRounds, mergeProgress, nextLessonIndex, parseProgress, recordAttempt, type SavedProgress } from "./progress";
import { FingerGuide, VisualKeyboard } from "./visual-keyboard";

type Phase = "theory" | "placement" | "practice" | "result";
const storageKey = "typeflow-learn-progress-v1";
function freshAttempt() { return { position: 0, mistakes: 0, streak: 0, bestStreak: 0, startedAt: 0, durationMs: 0, done: false, errors: {} as Record<string, number> }; }

export function LearningWorkspace() {
  const user = useAuth(state => state.user);
  const hydrated = useAuth(state => state.hydrated);
  const accountId = user?.role === "user" ? user.id : null;
  const localKey = accountId ? `${storageKey}:${accountId}` : storageKey;
  const [lessonIndex, setLessonIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("theory");
  const [attempt, setAttempt] = useState(freshAttempt);
  const attemptRef = useRef(attempt);
  const savedAttempt = useRef(false);
  const interacted = useRef(false);
  const [round, setRound] = useState(0);
  const [reviewKeys, setReviewKeys] = useState<string[]>([]);
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [progress, setProgress] = useState<SavedProgress>({});
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [syncReady, setSyncReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Loading progress...");
  const [storageError, setStorageError] = useState(false);
  const [syncRetry, setSyncRetry] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const lesson = beginnerLessons[lessonIndex];
  const target = useMemo(() => buildPracticeTarget(lesson, round, reviewKeys), [lesson, round, reviewKeys]);
  const { position, mistakes, streak, bestStreak, errors: errorsByKey } = attempt;
  const expected = target[position] || " ";
  const accuracy = position ? Math.round(position / (position + mistakes) * 100) : mistakes ? 0 : 100;
  const passed = phase === "result" && accuracy >= lesson.passAccuracy;
  const unlocked = nextLessonIndex(progress, beginnerLessons);
  const completed = beginnerLessons.filter(item => isMastered(progress[item.id])).length;
  const activeFingers = fingersForExpectedKey(expected);
  const introductionFingers = fingersForExpectedKey(lesson.keys[0]);
  const weakKeys = Object.entries(errorsByKey).sort((a, b) => b[1] - a[1]);
  const lessonStats = progress[lesson.id];
  const totalPracticeMs = Object.values(progress).reduce((sum, entry) => sum + entry.practiceMs, 0);
  const totalAttempts = Object.values(progress).reduce((sum, entry) => sum + entry.attempts, 0);
  const practiceKeys = [...new Set(target)];
  const activeFingerLabel = activeFingers.map(finger => fingerLabels[finger]).join(" + ");
  const showUppercase = lesson.technique === "shift" || lesson.id === "capitals";

  const clearAttempt = useCallback((nextPhase: Phase) => {
    interacted.current = true;
    const next = freshAttempt();
    attemptRef.current = next;
    savedAttempt.current = false;
    setAttempt(next);
    setLastPressed(null);
    setFeedback(null);
    setPhase(nextPhase);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    let local: SavedProgress = {};
    try { local = parseProgress(JSON.parse(localStorage.getItem(localKey) || "{}"), beginnerLessons); setStorageError(false); }
    catch { setStorageError(true); }
    setProgress(local);
    setReadyKey(localKey);
    setSyncReady(false);
    setLessonIndex(nextLessonIndex(local, beginnerLessons));
    setReviewKeys([]);
    setRound(local[beginnerLessons[nextLessonIndex(local, beginnerLessons)].id]?.attempts || 0);
    clearAttempt("theory");
    interacted.current = false;
    if (!accountId) { setSyncStatus("Saved on this device. Sign in to sync across devices."); return; }
    setSyncStatus("Syncing account progress...");
    void apiRequest<{ progress: unknown }>("/api/learn/progress").then(body => {
      if (!active) return;
      const remote = parseProgress(body.progress, beginnerLessons);
      setProgress(current => mergeProgress(current, remote));
      // Do not interrupt a lesson started while the account request was loading.
      if (!interacted.current) {
        const merged = mergeProgress(local, remote);
        const index = nextLessonIndex(merged, beginnerLessons);
        setLessonIndex(index);
        setRound(merged[beginnerLessons[index].id]?.attempts || 0);
      }
      setSyncReady(true);
      setSyncStatus("Account progress synced.");
    }).catch(() => { if (active) setSyncStatus("Account sync unavailable. Progress remains on this device."); });
    return () => { active = false; };
  }, [accountId, clearAttempt, hydrated, localKey, syncRetry]);

  useEffect(() => {
    if (readyKey !== localKey) return;
    try { localStorage.setItem(localKey, JSON.stringify(progress)); setStorageError(false); }
    catch { setStorageError(true); }
    if (!accountId || !syncReady) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSyncStatus("Saving account progress...");
      void apiRequest("/api/learn/progress", { method: "PUT", signal: controller.signal, body: JSON.stringify({ progress }) })
        .then(() => { if (!controller.signal.aborted) setSyncStatus("Account progress synced."); })
        .catch(() => { if (!controller.signal.aborted) setSyncStatus("Account sync unavailable. Progress remains on this device."); });
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [accountId, localKey, progress, readyKey, syncReady]);

  const acceptKey = useCallback((key: string) => {
    const current = attemptRef.current;
    if (phase !== "practice" || current.done || key.length !== 1) return;
    const now = Date.now();
    const next = { ...current, startedAt: current.startedAt || now, errors: { ...current.errors } };
    setLastPressed(key);
    if (key === target[current.position]) {
      next.position++;
      next.streak++;
      next.bestStreak = Math.max(next.bestStreak, next.streak);
      setFeedback("correct");
      if (next.position === target.length) {
        next.done = true;
        next.durationMs = Math.max(1000, now - next.startedAt);
        setPhase("result");
      }
    } else {
      next.mistakes++;
      next.streak = 0;
      const missed = target[current.position];
      next.errors[missed] = (next.errors[missed] || 0) + 1;
      setFeedback("wrong");
    }
    attemptRef.current = next;
    setAttempt(next);
  }, [phase, target]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase !== "practice" || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
      const element = event.target;
      if (element instanceof Element && element.closest("input,textarea,select,button,a,[contenteditable=true]")) return;
      if (event.key.length !== 1) return;
      event.preventDefault();
      acceptKey(event.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [acceptKey, phase]);

  useEffect(() => {
    if (phase === "practice") inputRef.current?.focus({ preventScroll: true });
  }, [phase, round]);

  useEffect(() => {
    if (phase !== "result" || savedAttempt.current || readyKey !== localKey) return;
    savedAttempt.current = true;
    setProgress(current => recordAttempt(current, lesson, accuracy, attempt.durationMs, errorsByKey, reviewKeys.length > 0));
  }, [accuracy, attempt.durationMs, errorsByKey, lesson, localKey, phase, readyKey, reviewKeys.length]);

  function select(index: number) {
    if (index < 0 || index > unlocked) return;
    setLessonIndex(index);
    setReviewKeys([]);
    setRound(progress[beginnerLessons[index].id]?.attempts || 0);
    clearAttempt("theory");
  }
  function startPractice(keys: string[] = []) {
    setReviewKeys(keys);
    setRound(value => value + 1);
    clearAttempt("practice");
  }
  function importDevicePractice() {
    try {
      const device = parseProgress(JSON.parse(localStorage.getItem(storageKey) || "{}"), beginnerLessons);
      if (!Object.keys(device).length) { setSyncStatus("No device practice to import."); return; }
      setProgress(current => mergeProgress(current, device));
      setSyncStatus("Device practice imported into this account.");
    } catch { setStorageError(true); }
  }

  const displayTarget = [...target].map((char, index) => <span key={index} data-state={index < position ? "done" : index === position ? "current" : "next"}>{char === " " ? "\u00b7" : char}</span>);
  const speed = Math.round(position / 5 / Math.max(1, attempt.durationMs) * 60_000);
  const storedWeakKeys = Object.entries(lessonStats?.errorsByKey || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return <main className="learn-shell"><header><Brand/><nav><Link href="/">Typing test</Link></nav></header>
    <section className="learning-dashboard" aria-label="Learning progress">
      <div><b>{completed}/{beginnerLessons.length}</b><span>lessons mastered</span></div>
      <div><b>{totalPracticeMs > 0 && totalPracticeMs < 60_000 ? "<1" : Math.round(totalPracticeMs / 60_000)} min</b><span>completed practice</span></div>
      <div><b>{totalAttempts}</b><span>rounds completed</span></div>
      <p role="status">{storageError ? "Browser storage is unavailable. Device progress may not survive a reload." : syncStatus}</p>
      {accountId && <button className="secondary" disabled={phase === "practice"} onClick={() => setSyncRetry(value => value + 1)}>Sync progress</button>}
      {accountId && <button className="secondary" disabled={phase === "practice"} onClick={importDevicePractice}>Import device practice</button>}
    </section>
    {readyKey !== localKey ? <p role="status">Loading your lessons...</p> : <div className="learn-layout">
      <aside className="lesson-rail"><div><span>Touch typing</span><strong>From anchors to sentences</strong><small>Two accurate rounds master each lesson.</small></div><div className="course-progress"><i style={{ width: `${completed / beginnerLessons.length * 100}%` }}/></div>
        {beginnerLessons.map((item, index) => { const mastered = isMastered(progress[item.id]); const locked = index > unlocked; return <button key={item.id} data-active={index === lessonIndex} disabled={locked} onClick={() => select(index)}><span>{mastered ? <Check size={14}/> : locked ? <LockKeyhole size={13}/> : item.number}</span><div><strong>{item.title}</strong><small>{mastered ? `${progress[item.id].accuracy}% best accuracy` : locked ? "Master the previous lesson" : `${Math.min(masteryRounds, progress[item.id]?.successes || 0)}/${masteryRounds} successful rounds`}</small></div></button>; })}
      </aside>
      <section className="lesson-stage"><div className="lesson-heading"><div><span>Lesson {lesson.number}</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></div><div className="lesson-score"><span><b>{accuracy}%</b> accuracy</span><span><b>{mistakes}</b> errors</span></div></div>
        {phase === "theory" && <div className="lesson-theory"><span>Step 1 · Learn</span><h2>Understand it first</h2><p>{lesson.theory}</p><div className="theory-goal"><strong>Your goal</strong><p>{lesson.goal} Complete {masteryRounds} full rounds at {lesson.passAccuracy}% accuracy to master this lesson.</p></div>
          {lessonStats && <div className="lesson-history"><strong>Your recent accuracy</strong><ol aria-label="Recent completed rounds">{lessonStats.recentAccuracy.map((value, index) => <li key={index}><span style={{ height: `${Math.max(5, value)}%` }}/><b>{value}%</b></li>)}</ol>{storedWeakKeys.length > 0 && <button className="secondary" onClick={() => startPractice(storedWeakKeys.map(([key]) => key))}>Practice weak keys: {storedWeakKeys.map(([key]) => keyLabel(key)).join(", ")}</button>}</div>}
          <button className="primary start-lesson" onClick={() => clearAttempt("placement")}>Show hand position <ChevronRight size={16}/></button></div>}
        {phase === "placement" && <div className="lesson-prepare"><div className="prepare-copy"><span>Step 2 · Hand position</span><h2>{lesson.technique === "shift" ? "Learn Shift before capitals" : lesson.technique === "space" ? "Learn the spacebar first" : "Set your hands first"}</h2><TeachingSteps steps={lesson.steps}/><button className="primary start-lesson" onClick={() => startPractice()}>Start practice <ChevronRight size={16}/></button><button className="text-action" onClick={() => clearAttempt("theory")}><ChevronLeft size={14}/> Review theory</button></div><div className="prepare-visual"><span>This lesson introduces</span><div className="lesson-key-list">{lesson.keys.map(key => <kbd key={key}>{keyLabel(key)}</kbd>)}</div><VisualKeyboard expected={lesson.keys[0]} pressed={null} allowed={lesson.keys} uppercaseLegends={showUppercase}/><FingerGuide active={introductionFingers}/></div></div>}
        {phase === "practice" && <><div className="live-feedback" data-feedback={feedback}><span>{reviewKeys.length ? "Focused review" : "Next key"}</span><b>{keyLabel(expected)}</b><small>{activeFingerLabel}</small><i>{feedback === "wrong" ? `Use ${activeFingerLabel}` : streak > 2 ? `${streak} correct in a row` : "Return to the home row"}</i></div><div className="lesson-target" aria-label={target}>{displayTarget}</div>
          <label className="lesson-input-label">Type here to practice<input ref={inputRef} className="lesson-input" aria-label="Lesson typing input" placeholder="Tap here or start typing" autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} inputMode="text" onPaste={event => event.preventDefault()} onDrop={event => event.preventDefault()}
            onKeyDown={event => { if (event.ctrlKey || event.altKey || event.metaKey || event.nativeEvent.isComposing) return; if (event.key.length === 1) { event.preventDefault(); if (!event.repeat) acceptKey(event.key); } }}
            onChange={event => { if ((event.nativeEvent as InputEvent).isComposing) return; const value = event.currentTarget.value; event.currentTarget.value = ""; for (const key of value) acceptKey(key); }}
            onCompositionEnd={event => { event.currentTarget.value = ""; for (const key of event.data) acceptKey(key); }}/></label>
          <div className="practice-meter"><span><i style={{ width: `${position / target.length * 100}%` }}/></span><small>{position} of {target.length} keys</small><small>best streak {bestStreak}</small></div><VisualKeyboard expected={expected} pressed={lastPressed} allowed={practiceKeys} uppercaseLegends={showUppercase}/><FingerGuide active={activeFingers}/><p className="lesson-note">Keep your eyes on the screen. An incorrect key waits for correction. Accuracy comes before speed.</p></>}
        {phase === "result" && <div className="lesson-result" data-passed={passed}><span>{reviewKeys.length ? "Focused review complete" : isMastered(lessonStats) ? "Lesson mastered" : passed ? "Successful round" : "Practice once more"}</span><h2>{accuracy}% accuracy</h2><div className="result-details"><div><b>{mistakes}</b><small>errors</small></div><div><b>{bestStreak}</b><small>best streak</small></div><div><b>{speed}</b><small>practice WPM</small></div></div>
          <p>{Math.min(masteryRounds, lessonStats?.successes || 0)}/{masteryRounds} successful full rounds · target {lesson.passAccuracy}% accuracy</p>
          {weakKeys.length > 0 && <div className="weak-key-review"><strong>Keys to repeat</strong>{weakKeys.slice(0, 4).map(([key, count]) => <span key={key}><kbd>{keyLabel(key)}</kbd>{count} {count === 1 ? "miss" : "misses"}</span>)}</div>}
          <p>{reviewKeys.length ? "Focused drills build control. Return to a full round to earn mastery." : passed ? "Keep accuracy steady as the exercise changes. Speed will develop with practice." : `Repeat and aim for ${lesson.passAccuracy}% accuracy.`}</p>
          <div className="lesson-result-actions"><button className="secondary" onClick={() => startPractice()}><RotateCcw size={15}/> {passed ? "Another full round" : "Practice again"}</button>{weakKeys.length > 0 && <button className="secondary" onClick={() => startPractice(weakKeys.slice(0, 4).map(([key]) => key))}>Practice missed keys</button>}{isMastered(lessonStats) && lessonIndex < beginnerLessons.length - 1 && <button className="primary" onClick={() => select(lessonIndex + 1)}>Next lesson <ChevronRight size={15}/></button>}</div></div>}
        <div className="lesson-navigation"><button title="Previous lesson" disabled={lessonIndex === 0} onClick={() => select(lessonIndex - 1)}><ChevronLeft size={16}/></button><span>Lesson {lesson.number} of {beginnerLessons.length}</span><button title="Review lesson theory" onClick={() => clearAttempt("theory")}><RotateCcw size={15}/></button></div>
      </section>
    </div>}
  </main>;
}

function TeachingSteps({ steps }: { steps: TeachingStep[] }) {
  const icons = { anchor: Keyboard, hand: Hand, movement: CircleDot };
  return <div className="setup-steps">{steps.map(step => { const Icon = icons[step.kind]; return <div key={step.title}><Icon size={18}/><p><b>{step.title}</b><small>{step.detail}</small></p></div>; })}</div>;
}
