"use client";
import { generateWords } from "@typing/word-lists";
import type { RaceMode } from "@typing/shared-types";
import { CircleHelp, GraduationCap, History, LogOut, Moon, RotateCcw, Settings, Sun, Trophy, UserRoundCheck, Users } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTypingEngine } from "../hooks/use-typing-engine";
import { useAuth } from "../stores/auth";
import { AuthDialog } from "./auth-dialog";
import { Multiplayer } from "./multiplayer";
import { TypingLines } from "./typing-lines";
import { TypingStream } from "./typing-stream";
import { Brand } from "./brand";
import { restartTourEvent } from "./product-tour";
const ResultChart=dynamic(()=>import("./result-chart").then(module=>module.ResultChart),{ssr:false});

export function TypingWorkspace() {
  const [mode, setMode] = useState<RaceMode>("normal");
  const [duration, setDuration] = useState(30);
  const [testKind,setTestKind]=useState<"time"|"words">("time"); const [packetPage,setPacketPage]=useState(0); const [theme,setTheme]=useState<"dark"|"light">("dark"); const [focused,setFocused]=useState(true);const [online,setOnline]=useState(true);
  const [serverWords,setServerWords]=useState<string[]|null>(null);const [soloRaceId,setSoloRaceId]=useState<string|null>(null);const submittedRace=useRef<string|null>(null);
  const startedRace=useRef<string|null>(null);
  const extendingPacket=useRef(false);
  const typingInput=useRef<HTMLTextAreaElement>(null);
  const resultsSection=useRef<HTMLDivElement>(null);
  const settingsRef=useRef<HTMLDivElement>(null);
  const [runSeed,setRunSeed]=useState("initial");const [runNumber,setRunNumber]=useState(0);
  const [wordCount,setWordCount]=useState<25|50|100>(50); const [numbers,setNumbers]=useState(false); const [punctuation,setPunctuation]=useState(false); const [authOpen,setAuthOpen]=useState(false); const [multi,setMulti]=useState(false); const [settingsOpen,setSettingsOpen]=useState(false);
  const [layout,setLayout]=useState<"monkey"|"lines">("monkey");
  const user=useAuth(s=>s.user); const setUser=useAuth(s=>s.setUser); const setHydrated=useAuth(s=>s.setHydrated); const clear=useAuth(s=>s.clear);
  const configKey=`${testKind}-${mode}-${wordCount}-${numbers}-${punctuation}`;
  const localWords=useMemo(()=>generateWords({seed:`solo-${runSeed}`,count:testKind==="time"?200+packetPage*100:wordCount,list:mode==="hard"?"hard":"common",numbers,punctuation}),[mode,numbers,packetPage,punctuation,runSeed,testKind,wordCount]);const words=serverWords||localWords;
  const engine = useTypingEngine(words, duration, mode === "hard", testKind, `${configKey}-${runNumber}`);
  useEffect(()=>{if(testKind==="time"&&engine.target.length-engine.typed.length<180)setPacketPage(value=>value+1)},[engine.target.length,engine.typed.length,testKind]);
  useEffect(()=>{if(testKind!=="time"||!soloRaceId||!serverWords||engine.target.length-engine.typed.length>=500||extendingPacket.current)return;extendingPacket.current=true;fetch(`/api/races/${soloRaceId}/extend`,{method:"POST"}).then(async response=>{if(response.ok)setServerWords((await response.json()).words)}).finally(()=>{extendingPacket.current=false})},[engine.target.length,engine.typed.length,serverWords,soloRaceId,testKind]);
  useEffect(()=>{const saved=localStorage.getItem("typing-theme");setTheme(saved==="light"||saved==="dark"?saved:matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");setOnline(navigator.onLine);const up=()=>setOnline(true);const down=()=>setOnline(false);window.addEventListener("online",up);window.addEventListener("offline",down);return()=>{window.removeEventListener("online",up);window.removeEventListener("offline",down)}},[]);
  useEffect(()=>{setRunSeed(crypto.randomUUID())},[]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("typing-theme",theme)},[theme]);
  useEffect(()=>{if(!settingsOpen)return;const close=(event:PointerEvent)=>{if(!settingsRef.current?.contains(event.target as Node))setSettingsOpen(false)};const escape=(event:KeyboardEvent)=>{if(event.key==="Escape")setSettingsOpen(false)};document.addEventListener("pointerdown",close);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape)}},[settingsOpen]);
  useEffect(()=>{setPacketPage(0)},[configKey]);
  useEffect(()=>{if(!user){setServerWords(null);setSoloRaceId(null);return}setServerWords(null);setSoloRaceId(null);extendingPacket.current=false;fetch("/api/races/solo",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode,wordCount:testKind==="time"?100:wordCount,timed:testKind==="time",numbers,punctuation})}).then(async response=>{if(response.ok){const body=await response.json();setServerWords(body.wordPacket.words);setSoloRaceId(body.raceId);submittedRace.current=null;startedRace.current=null}})},[mode,numbers,punctuation,runNumber,testKind,user,wordCount]);
  useEffect(()=>{if(!soloRaceId||!engine.typed||startedRace.current===soloRaceId)return;startedRace.current=soloRaceId;fetch(`/api/races/${soloRaceId}/start`,{method:"POST"})},[engine.typed,soloRaceId]);
  useEffect(()=>{if(!engine.finished||!soloRaceId||submittedRace.current===soloRaceId||engine.elapsedMs<500)return;submittedRace.current=soloRaceId;fetch(`/api/races/${soloRaceId}/complete`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({typedText:engine.typed,durationMs:engine.elapsedMs})})},[engine.elapsedMs,engine.finished,engine.typed,soloRaceId]);
  useEffect(()=>{if(!engine.finished)return;const frame=requestAnimationFrame(()=>resultsSection.current?.scrollIntoView({behavior:"smooth",block:"start"}));return()=>cancelAnimationFrame(frame)},[engine.finished]);
  useEffect(()=>{fetch("/api/auth/refresh",{method:"POST"}).then(async response=>{if(response.ok){const body=await response.json();setUser(body.user)}}).finally(setHydrated)},[setHydrated,setUser]);
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});clear()}
  function restart(){setRunSeed(crypto.randomUUID());setRunNumber(value=>value+1)}
  useEffect(()=>{const handle=(event:KeyboardEvent)=>{if(authOpen||event.ctrlKey||event.metaKey||event.altKey)return;const element=event.target as HTMLElement;if(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement||element instanceof HTMLSelectElement||element.isContentEditable)return;if(event.key==="Escape"){typingInput.current?.blur();return}if(event.key==="Tab"){event.preventDefault();typingInput.current?.focus();return}if(event.key==="Enter"&&engine.finished){event.preventDefault();restart();return}if(event.key==="Backspace"){event.preventDefault();typingInput.current?.focus();engine.input(engine.typed.slice(0,-1));return}if(event.key.length===1){event.preventDefault();typingInput.current?.focus();engine.input(engine.typed+event.key)}};window.addEventListener("keydown",handle);return()=>window.removeEventListener("keydown",handle)},[authOpen,engine]);
  if(multi&&user)return <main><Multiplayer mode={mode} wordCount={wordCount} numbers={numbers} punctuation={punctuation} onClose={()=>setMulti(false)}/></main>;
  return <main>
    <header><Brand/><nav>{!online&&<span className="offline" role="status">Offline</span>}<Link className="icon-link" href="/learn" title="Learn touch typing" data-tour="learn"><GraduationCap size={17}/></Link><Link className="icon-link" href="/leaderboard" title="Leaderboard"><Trophy size={17}/></Link>{user?.role==="user"&&<><Link className="icon-link" href="/history" title="Result history"><History size={17}/></Link><Link className="icon-link" href="/friends" title="Friends"><UserRoundCheck size={17}/></Link></>}<button title="Multiplayer" data-tour="multiplayer" disabled={!online} onClick={()=>user?setMulti(true):setAuthOpen(true)}><Users size={17}/></button><div ref={settingsRef} className="settings-wrap" data-tour="settings"><button title="Settings" aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(value=>!value)}><Settings size={17}/></button>{settingsOpen&&<div className="settings-popover"><strong>Settings</strong><div className="settings-group"><span>Appearance</span><div className="settings-options"><button title="Use dark mode" aria-label="Use dark mode" data-active={theme==="dark"} onClick={()=>setTheme("dark")}><Moon size={16}/></button><button title="Use light mode" aria-label="Use light mode" data-active={theme==="light"} onClick={()=>setTheme("light")}><Sun size={16}/></button></div></div><div className="settings-group"><span>Help</span><button className="secondary" onClick={()=>{setSettingsOpen(false);window.dispatchEvent(new Event(restartTourEvent))}}><CircleHelp size={15}/> Start product guide</button></div></div>}</div>{user?<><span className="user-name">{user.displayName}</span><button title="Log out" onClick={logout}><LogOut size={17}/></button></>:<button className="account" disabled={!online} onClick={()=>setAuthOpen(true)}>Sign in</button>}</nav></header>
    <section className="controls" aria-label="Typing settings" data-tour="test-settings">
      <div className="control-row"><div className="segments">{(["time","words"] as const).map(value=><button key={value} disabled={engine.running} data-active={testKind===value} onClick={()=>setTestKind(value)}>{value}</button>)}</div><div className="segments">{(["normal","medium","hard"] as const).map(value => <button disabled={engine.running} key={value} data-active={mode===value} onClick={() => setMode(value)}>{value}</button>)}</div><div className="segments layout-switch" aria-label="Typing layout"><button disabled={engine.running} data-active={layout==="monkey"} onClick={()=>setLayout("monkey")}>Stream</button><button disabled={engine.running} data-active={layout==="lines"} onClick={()=>setLayout("lines")}>Line focus</button></div>{testKind==="words"&&<div className="segments">{([25,50,100] as const).map(value => <button disabled={engine.running} key={value} data-active={wordCount===value} onClick={()=>setWordCount(value)}>{value}</button>)}</div>}</div>
      <div className="control-row"><label><input disabled={engine.running} type="checkbox" checked={punctuation} onChange={event=>setPunctuation(event.target.checked)}/> punctuation</label><label><input disabled={engine.running} type="checkbox" checked={numbers} onChange={event=>setNumbers(event.target.checked)}/> numbers</label>{testKind==="time"&&<div className="segments">{[15,30,60,120].map(value => <button disabled={engine.running} key={value} data-active={duration===value} onClick={() => setDuration(value)}>{value}</button>)}</div>}</div>
    </section>
    <section className="race" data-tour="typing-area">
      <div className="test-status"><div className="status-metric"><b>{engine.wpm}</b><span>wpm</span></div><div className="timer-readout" aria-live="polite"><b>{engine.remaining}</b><span>{testKind==="time"?"seconds left":"seconds elapsed"}</span></div><div className="status-metric status-accuracy"><b>{engine.accuracy}%</b><span>accuracy</span></div></div>
      {layout==="monkey"?<TypingStream target={engine.target} typed={engine.typed} onFocus={()=>document.querySelector<HTMLTextAreaElement>("textarea")?.focus()}/>:<TypingLines target={engine.target} typed={engine.typed} onFocus={()=>document.querySelector<HTMLTextAreaElement>("textarea")?.focus()}/>} 
      <textarea ref={typingInput} autoFocus value={engine.typed} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onPaste={event=>event.preventDefault()} onKeyDown={event=>{if(event.key==="Escape")event.currentTarget.blur();if(event.key==="Tab")event.preventDefault();if(event.key==="Enter"){event.preventDefault();if(engine.finished)restart()}}} onChange={event=>engine.input(event.target.value)} aria-label="Typing input" spellCheck={false}/>{engine.running&&!focused&&<div className="focus-warning">Start typing to continue</div>}
      <button className="reset" onClick={restart} title="Restart with new words"><RotateCcw size={16}/></button>
      <div className="keyboard-hints" aria-label="Keyboard controls"><span><kbd>Tab</kbd> focus</span><span><kbd>Esc</kbd> unfocus</span><span><kbd>Enter</kbd> restart after result</span></div>
      {engine.finished&&<div ref={resultsSection} className="results"><div className="result-overview"><div className="result-hero"><span>wpm</span><b>{engine.wpm}</b><small>{engine.rawWpm} raw</small></div><div className="result-metrics"><div><b>{engine.accuracy}%</b><span>accuracy</span></div><div><b>{engine.consistency}%</b><span>consistency</span></div><div><b>{Math.max(1,Math.round(engine.elapsedMs/1000))}s</b><span>test time</span></div></div></div><div className="character-breakdown" aria-label="Character breakdown"><div data-kind="correct"><span>Correct</span><b>{engine.characterStats.correct}</b></div><div data-kind="incorrect"><span>Incorrect</span><b>{engine.characterStats.incorrect}</b></div><div data-kind="extra"><span>Extra</span><b>{engine.characterStats.extra}</b></div><div data-kind="missed"><span>Missed</span><b>{engine.characterStats.missed}</b></div></div><ResultChart data={engine.history}/></div>}
    </section>
    <AuthDialog open={authOpen} onClose={()=>setAuthOpen(false)}/>
  </main>;
}
