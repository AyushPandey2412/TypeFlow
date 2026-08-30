"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

const storageKey = "typeflow-product-tour-v1";
export const restartTourEvent = "typeflow:restart-tour";

const steps = [
  { target: "[data-tour='brand']", title: "Welcome to Typeflow", body: "Build typing accuracy, learn correct finger placement, and race other typists." },
  { target: "[data-tour='learn']", title: "Learn touch typing", body: "Start with guided theory, hand placement, and short practice lessons." },
  { target: "[data-tour='test-settings']", title: "Choose your test", body: "Set time or word count, difficulty, layout, punctuation, and numbers before typing." },
  { target: "[data-tour='typing-area']", title: "Type from anywhere", body: "Press any character to begin. Your WPM, time, and accuracy update while you type." },
  { target: "[data-tour='multiplayer']", title: "Race with others", body: "Sign in to join multiplayer races, save results, and compete on the leaderboard." },
  { target: "[data-tour='settings']", title: "Replay this guide", body: "Open Settings whenever you want to run this tour again." },
];

type Box = { top: number; left: number; width: number; height: number };

export function ProductTour() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);

  const close = useCallback(() => {
    localStorage.setItem(storageKey, "complete");
    setActive(false);
  }, []);

  useEffect(() => {
    const restart = () => { setIndex(0); setActive(true); };
    window.addEventListener(restartTourEvent, restart);
    if (pathname === "/" && !localStorage.getItem(storageKey)) setActive(true);
    return () => window.removeEventListener(restartTourEvent, restart);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!active || pathname !== "/") return;
    const update = () => {
      const element = document.querySelector<HTMLElement>(steps[index].target);
      if (!element) return setBox(null);
      const rect = element.getBoundingClientRect();
      setBox({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    const frame = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [active, index, pathname]);

  if (!active || pathname !== "/" || !box) return null;
  const step = steps[index];
  const placeAbove = box.top > window.innerHeight * 0.58;
  const tooltipTop = placeAbove ? box.top - 16 : box.top + box.height + 16;

  return <div className="tour-layer" role="dialog" aria-modal="true" aria-label="Typeflow product guide">
    <div className="tour-spotlight" style={{ top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12 }}/>
    <section className="tour-tooltip" data-place={placeAbove ? "above" : "below"} style={{ top: tooltipTop, left: Math.min(Math.max(16, box.left), window.innerWidth - 356) }}>
      <div className="tour-progress"><span>{index + 1} of {steps.length}</span><button onClick={close} title="Skip guide"><X size={16}/></button></div>
      <h2>{step.title}</h2><p>{step.body}</p>
      <div className="tour-actions"><button className="tour-skip" onClick={close}>Skip</button><div>{index > 0 && <button title="Previous step" onClick={() => setIndex(value => value - 1)}><ChevronLeft size={16}/></button>}<button className="primary" onClick={() => index === steps.length - 1 ? close() : setIndex(value => value + 1)}>{index === steps.length - 1 ? "Finish" : "Next"}<ChevronRight size={15}/></button></div></div>
    </section>
  </div>;
}
