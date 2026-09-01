"use client";
import { Users, X } from "lucide-react";

export function RaceSetup({ playerCount, setPlayerCount, onStart, onClose }: { playerCount: 2 | 3; setPlayerCount: (value: 2 | 3) => void; onStart: () => void; onClose: () => void }) {
  return <div className="backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog race-setup" role="dialog" aria-modal="true" aria-labelledby="race-setup-title">
      <button className="close" title="Close" onClick={onClose}><X size={18}/></button>
      <Users size={20}/><h2 id="race-setup-title">Start a live race</h2><p>Choose the lobby size. The race also starts automatically after ten seconds.</p>
      <span className="field-label">Players</span><div className="segments">{([2, 3] as const).map(value => <button key={value} data-active={playerCount === value} onClick={() => setPlayerCount(value)}>{value} players</button>)}</div>
      <button className="primary" onClick={onStart}>Find players</button>
    </section>
  </div>;
}
