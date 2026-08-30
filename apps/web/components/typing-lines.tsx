"use client";
import { Fragment, useMemo } from "react";

type Line = {
  text: string;
  firstWord: number;
  lastWord: number;
};

function splitLines(target: string, limit = 54): Line[] {
  const words = target.split(" ");
  const lines: Line[] = [];
  let firstWord = 0;
  let current: string[] = [];

  words.forEach((word, index) => {
    const nextLength = current.length ? current.join(" ").length + word.length + 1 : word.length;
    if (current.length && nextLength > limit) {
      lines.push({ text: current.join(" "), firstWord, lastWord: index - 1 });
      firstWord = index;
      current = [];
    }
    current.push(word);
  });

  if (current.length) lines.push({ text: current.join(" "), firstWord, lastWord: words.length - 1 });
  return lines;
}

export function TypingLines({ target, typed, onFocus }: { target: string; typed: string; onFocus: () => void }) {
  const targetWords = useMemo(() => target.split(" "), [target]);
  const lines = useMemo(() => splitLines(target), [target]);
  const typedWords = typed.split(" ");
  const activeWord = Math.min(typedWords.length - 1, targetWords.length - 1);
  const activeIndex = Math.max(0, lines.findIndex(line => activeWord <= line.lastWord));
  const firstVisible = Math.max(0, activeIndex - 1);

  return <div className="writing-lines" onClick={onFocus}>
    {lines.slice(firstVisible, firstVisible + 4).map((line, visibleIndex) => {
      const lineIndex = firstVisible + visibleIndex;
      const relation = lineIndex === activeIndex ? "active" : lineIndex < activeIndex ? "complete" : "upcoming";
      return <div className="writing-row" data-state={relation} key={line.firstWord}>
        <div className="prompt-line">{line.text}</div>
        <div className="entered-line" aria-hidden="true">
          {targetWords.slice(line.firstWord, line.lastWord + 1).map((targetWord, relativeIndex) => {
            const wordIndex = line.firstWord + relativeIndex;
            if (wordIndex > activeWord) return null;
            const enteredWord = typedWords[wordIndex] || "";
            const submitted = wordIndex < activeWord;
            return <Fragment key={wordIndex}>
              {[...enteredWord].map((char, characterIndex) => <span key={characterIndex} data-state={char === targetWord[characterIndex] ? "correct" : "wrong"}>{char}</span>)}
              {wordIndex < line.lastWord && (submitted || enteredWord.length >= targetWord.length) && <span data-state="correct"> </span>}
            </Fragment>;
          })}
          {relation === "active" && <i className="line-caret"/>}
        </div>
      </div>;
    })}
  </div>;
}
