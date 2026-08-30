"use client";
import { useEffect, useMemo, useRef } from "react";

export function TypingStream({ target, typed, onFocus }: { target: string; typed: string; onFocus: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLSpanElement>(null);
  const words = useMemo(() => {
    let offset = 0;
    return target.split(" ").map(text => { const word = { text, start: offset }; offset += text.length + 1; return word; });
  }, [target]);
  const typedWords=typed.split(" ");const activeWord=Math.min(typedWords.length-1,words.length-1);
  useEffect(() => {
    const box = container.current; const word = active.current;const caret=box?.querySelector<HTMLElement>('[data-state="caret"]');
    if (!box || !word) return;
    const lineHeight = Number.parseFloat(getComputedStyle(box).lineHeight);
    const position=caret?.offsetTop??word.offsetTop;
    if (position >= box.scrollTop + lineHeight * 3.4 || position < box.scrollTop) box.scrollTo({ top: Math.max(0, position - lineHeight), behavior: "smooth" });
  }, [activeWord,typed.length]);
  return <div ref={container} className="words stream-words" onClick={onFocus}>
    {words.map((word,wordIndex)=>{const entered=typedWords[wordIndex]??"";const submitted=wordIndex<activeWord;return <span ref={wordIndex===activeWord?active:null} className="stream-word" data-active={wordIndex===activeWord} key={word.start}>{[...word.text].map((char,index)=><span key={word.start+index} data-state={index<entered.length?(entered[index]===char?"correct":"wrong"):submitted?"wrong":wordIndex===activeWord&&index===entered.length?"caret":"upcoming"}>{char}</span>)}{entered.length>word.text.length&&[...entered.slice(word.text.length)].map((char,index)=><span data-state="wrong" className="extra-character" key={`extra-${word.start}-${index}`}>{char}</span>)}{wordIndex<words.length-1&&<span data-state={submitted?"correct":wordIndex===activeWord&&entered.length>=word.text.length?"caret":"upcoming"}> </span>}</span>})}
  </div>;
}
