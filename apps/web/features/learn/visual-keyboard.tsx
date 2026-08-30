import { fingerByKey, fingerLabels, fingersForExpectedKey, isUppercaseLetter, keyLabel, type FingerId } from "./course";

const rows = [["1","2","3","4","5","6","7","8","9","0"],["q","w","e","r","t","y","u","i","o","p"],["a","s","d","f","g","h","j","k","l",";"],["shift-left","z","x","c","v","b","n","m",",",".","/","shift-right"],[" "]];
const shortFinger: Record<FingerId, string> = { "left-pinky":"LP", "left-ring":"LR", "left-middle":"LM", "left-index":"LI", "right-index":"RI", "right-middle":"RM", "right-ring":"RR", "right-pinky":"RP", thumb:"TH" };

export function VisualKeyboard({ expected, pressed, allowed, uppercaseLegends = false }: { expected: string; pressed: string | null; allowed: string[]; uppercaseLegends?: boolean }) {
  const normalizedExpected = expected.toLowerCase();
  const expectedFingers = fingersForExpectedKey(expected);
  const shiftKey = isUppercaseLetter(expected) ? (expectedFingers[0].startsWith("left") ? "shift-right" : "shift-left") : null;
  const normalizedAllowed = allowed.map(key => key.toLowerCase());
  return <div className="learn-keyboard" role="img" aria-label={`Keyboard finger map. Next key ${keyLabel(expected)}`}>
    {rows.map((row, rowIndex) => <div className="keyboard-row" key={rowIndex}>{row.map(key => {
      const finger = fingerByKey[key];
      const isShift = key.startsWith("shift-");
      const isExpected = key === normalizedExpected || key === shiftKey;
      const isError = !isShift && key === pressed?.toLowerCase() && pressed !== expected;
      const state = isError ? "error" : isExpected ? "expected" : normalizedAllowed.includes(key) ? "lesson" : "idle";
      const label = isShift ? "Shift" : uppercaseLegends && /^[a-z]$/.test(key) ? key.toUpperCase() : keyLabel(key);
      return <div className="keyboard-key" data-state={state} data-finger={finger} data-key-type={isShift ? "shift" : "standard"} key={key} aria-label={`${label}, ${fingerLabels[finger]}`}><span>{label}</span>{state !== "idle" && <small>{shortFinger[finger]}</small>}{(key === "f" || key === "j") && <i/>}</div>;
    })}</div>)}
  </div>;
}

export function FingerGuide({ active }: { active: FingerId | FingerId[] }) {
  const activeFingers = Array.isArray(active) ? active : [active];
  const left: FingerId[] = ["left-pinky","left-ring","left-middle","left-index"];
  const right: FingerId[] = ["right-index","right-middle","right-ring","right-pinky"];
  return <div className="finger-guide" role="img" aria-label={`Use ${activeFingers.map(finger => fingerLabels[finger]).join(" and ")}`}><HandGroup label="Left hand" fingers={left} active={activeFingers}/><div className="thumb-guide" data-active={activeFingers.includes("thumb")}><i/><span>Thumb<br/>Space</span></div><HandGroup label="Right hand" fingers={right} active={activeFingers}/></div>;
}

function HandGroup({ label, fingers, active }: { label: string; fingers: FingerId[]; active: FingerId[] }) {
  return <div className="hand-group"><strong>{label}</strong><div>{fingers.map((finger, index) => <div key={finger} className="finger" data-active={active.includes(finger)} data-position={index}><i/><span>{finger.split("-")[1]}</span></div>)}</div><small>Home row</small></div>;
}
