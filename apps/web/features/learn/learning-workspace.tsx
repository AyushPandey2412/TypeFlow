"use client";
import { Check, ChevronLeft, ChevronRight, CircleDot, Hand, Keyboard, LockKeyhole, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "../../components/brand";
import { beginnerLessons, fingerLabels, fingersForExpectedKey, keyLabel, type TeachingStep } from "./course";
import { FingerGuide, VisualKeyboard } from "./visual-keyboard";

type Phase = "theory" | "placement" | "practice" | "result";
type SavedProgress = Record<string, { accuracy: number; completedAt: string }>;
const storageKey = "typeflow-learn-progress-v1";

export function LearningWorkspace() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("theory");
  const [position, setPosition] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [errorsByKey, setErrorsByKey] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState<SavedProgress>({});

  const lesson = beginnerLessons[lessonIndex];
  const expected = lesson.target[position] || " ";
  const accuracy = Math.round(position / Math.max(1, position + mistakes) * 100);
  const passed = phase === "result" && accuracy >= lesson.passAccuracy;
  const firstIncomplete = beginnerLessons.findIndex(item => !progress[item.id]);
  const unlocked = firstIncomplete === -1 ? beginnerLessons.length - 1 : firstIncomplete;
  const activeFingers = fingersForExpectedKey(expected);
  const introductionFingers = fingersForExpectedKey(lesson.keys[0]);

  useEffect(() => {
    try { setProgress(JSON.parse(localStorage.getItem(storageKey) || "{}")); }
    catch { setProgress({}); }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase !== "practice" || event.ctrlKey || event.altKey || event.metaKey) return;
      const element = event.target as HTMLElement;
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return;
      let key = event.key;
      if (key === "spacebar") key = " ";
      if (key.length !== 1) return;
      event.preventDefault();
      setLastPressed(key);
      if (key === expected) {
        const nextPosition = position + 1;
        const nextStreak = streak + 1;
        setPosition(nextPosition);
        setStreak(nextStreak);
        setBestStreak(value => Math.max(value, nextStreak));
        setFeedback("correct");
        if (nextPosition >= lesson.target.length) setPhase("result");
      } else {
        setMistakes(value => value + 1);
        setStreak(0);
        setFeedback("wrong");
        setErrorsByKey(value => ({ ...value, [expected]: (value[expected] || 0) + 1 }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expected, lesson.target.length, phase, position, streak]);

  useEffect(() => {
    if (!passed) return;
    const existing = progress[lesson.id];
    if (existing && existing.accuracy >= accuracy) return;
    const next = { ...progress, [lesson.id]: { accuracy, completedAt: new Date().toISOString() } };
    setProgress(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }, [accuracy, lesson.id, passed, progress]);

  function clearAttempt(nextPhase: Phase) {
    setPosition(0); setMistakes(0); setStreak(0); setBestStreak(0);
    setLastPressed(null); setFeedback(null); setErrorsByKey({}); setPhase(nextPhase);
  }
  function select(index: number) { if (index <= unlocked) { setLessonIndex(index); clearAttempt("theory"); } }

  const displayTarget = useMemo(() => [...lesson.target].map((char, index) => <span key={index} data-state={index < position ? "done" : index === position ? "current" : "next"}>{char === " " ? "\u00b7" : char}</span>), [lesson.target, position]);
  const weakKeys = Object.entries(errorsByKey).sort((a, b) => b[1] - a[1]);
  const practiceKeys = [...new Set(lesson.target.replaceAll(" ", "").split(""))];
  const activeFingerLabel = activeFingers.map(finger => fingerLabels[finger]).join(" + ");
  const showUppercase = lesson.technique === "shift";
  const preparationTitle = lesson.technique === "space" ? "Learn the spacebar first" : lesson.technique === "shift" ? "Learn Shift before capitals" : "Set your hands first";

  return <main className="learn-shell"><header><Brand/><nav><Link href="/">Typing test</Link></nav></header><div className="learn-layout">
    <aside className="lesson-rail"><div><span>Beginner</span><strong>Home row foundations</strong><small>{Object.keys(progress).length} of {beginnerLessons.length} complete</small></div><div className="course-progress"><i style={{ width: `${Object.keys(progress).length / beginnerLessons.length * 100}%` }}/></div>{beginnerLessons.map((item, index) => { const locked = index > unlocked; return <button key={item.id} data-active={index === lessonIndex} disabled={locked} onClick={() => select(index)}><span>{progress[item.id] ? <Check size={14}/> : locked ? <LockKeyhole size={13}/> : item.number}</span><div><strong>{item.title}</strong><small>{progress[item.id] ? `${progress[item.id].accuracy}% accuracy` : locked ? "Complete the previous lesson" : item.summary}</small></div></button>; })}</aside>
    <section className="lesson-stage"><LessonHeader number={lesson.number} title={lesson.title} summary={lesson.summary} accuracy={accuracy} mistakes={mistakes}/>
      {phase === "theory" && <div className="lesson-theory"><span>Step 1 · Learn</span><h2>Understand it first</h2><p>{lesson.theory}</p><div className="theory-goal"><strong>Your goal</strong><p>{lesson.goal}</p></div><button className="primary start-lesson" onClick={() => clearAttempt("placement")}>Show hand position <ChevronRight size={16}/></button></div>}
      {phase === "placement" && <div className="lesson-prepare"><div className="prepare-copy"><span>Step 2 · Hand position</span><h2>{preparationTitle}</h2><TeachingSteps steps={lesson.steps}/><button className="primary start-lesson" onClick={() => clearAttempt("practice")}>Start small practice <ChevronRight size={16}/></button><button className="text-action" onClick={() => clearAttempt("theory")}><ChevronLeft size={14}/> Review theory</button></div><div className="prepare-visual"><span>This lesson uses</span><div className="lesson-key-list">{lesson.keys.map(key => <kbd key={key}>{keyLabel(key)}</kbd>)}</div><VisualKeyboard expected={lesson.keys[0]} pressed={null} allowed={lesson.keys} uppercaseLegends={showUppercase}/><FingerGuide active={introductionFingers}/></div></div>}
      {phase === "practice" && <><div className="live-feedback" data-feedback={feedback}><span>Next key</span><b>{keyLabel(expected)}</b><small>{activeFingerLabel}</small><i>{feedback === "wrong" ? `Use ${activeFingerLabel}` : streak > 2 ? `${streak} correct in a row` : "Return to the home row"}</i></div><div className="lesson-target" aria-label={lesson.target}>{displayTarget}</div><div className="practice-meter"><span><i style={{ width: `${position / lesson.target.length * 100}%` }}/></span><small>{position} of {lesson.target.length} keys</small><small>best streak {bestStreak}</small></div><VisualKeyboard expected={expected} pressed={lastPressed} allowed={[...practiceKeys, " "]} uppercaseLegends={showUppercase}/><FingerGuide active={activeFingers}/><p className="lesson-note">Look at the screen, not your physical keyboard. The expected key will wait after an error.</p></>}
      {phase === "result" && <div className="lesson-result" data-passed={passed}><span>{passed ? "Lesson complete" : "Practice once more"}</span><h2>{accuracy}% accuracy</h2><div className="result-details"><div><b>{mistakes}</b><small>errors</small></div><div><b>{bestStreak}</b><small>best streak</small></div><div><b>{lesson.passAccuracy}%</b><small>target</small></div></div>{weakKeys.length > 0 && <div className="weak-key-review"><strong>Keys to repeat</strong>{weakKeys.slice(0, 4).map(([key, count]) => <span key={key}><kbd>{keyLabel(key)}</kbd>{count} {count === 1 ? "miss" : "misses"}</span>)}</div>}<p>{passed ? "Progress is saved on this device. Keep accuracy steady before adding more keys." : `Repeat this short task and reach ${lesson.passAccuracy}% accuracy.`}</p><div><button className="secondary" onClick={() => clearAttempt("practice")}><RotateCcw size={15}/> Practice again</button>{passed && lessonIndex < beginnerLessons.length - 1 && <button className="primary" onClick={() => select(lessonIndex + 1)}>Next lesson <ChevronRight size={15}/></button>}</div></div>}
      <div className="lesson-navigation"><button title="Previous lesson" disabled={lessonIndex === 0} onClick={() => select(lessonIndex - 1)}><ChevronLeft size={16}/></button><span>Lesson {lesson.number} of {beginnerLessons.length}</span><button title="Learn this lesson again" onClick={() => clearAttempt("theory")}><RotateCcw size={15}/></button></div>
    </section>
  </div></main>;
}

function LessonHeader({ number, title, summary, accuracy, mistakes }: { number: number; title: string; summary: string; accuracy: number; mistakes: number }) {
  return <div className="lesson-heading"><div><span>Lesson {number}</span><h1>{title}</h1><p>{summary}</p></div><div className="lesson-score"><span><b>{accuracy}%</b> accuracy</span><span><b>{mistakes}</b> errors</span></div></div>;
}

function TeachingSteps({ steps }: { steps: TeachingStep[] }) {
  const icons = { anchor: Keyboard, hand: Hand, movement: CircleDot };
  return <div className="setup-steps">{steps.map(step => { const Icon = icons[step.kind]; return <div key={step.title}><Icon size={18}/><p><b>{step.title}</b><small>{step.detail}</small></p></div>; })}</div>;
}
