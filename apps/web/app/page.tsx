import { TypingWorkspace } from "../components/typing-workspace";
import Link from "next/link";
export default function Page() {
  return <><TypingWorkspace/><section className="home-content" aria-labelledby="typing-test-heading">
    <h1 id="typing-test-heading" style={{fontSize:"clamp(1.7rem, 4vw, 2.3rem)",lineHeight:1.2,margin:"0 0 14px"}}>Free typing speed test and WPM practice</h1>
    <p>Find out how fast and accurately you type with Typeflow. Choose a 15, 30, 60 or 120 second typing test, or practice 25, 50 or 100 words. See your words per minute (WPM), accuracy and consistency, then use the results to guide your next session.</p>
    <div>
      <article><h2>Measure your typing speed</h2><p>Compare corrected WPM with raw speed and character-level mistakes. Corrected WPM rewards matching the prompt, so typing quickly with errors does not inflate your score.</p></article>
      <article><h2>Learn touch typing</h2><p>Practice home-row finger placement with <Link href="/learn">guided touch typing lessons</Link>. Switch between word tests and continuous writing, with vocabulary levels, punctuation and numbers.</p></article>
      <article><h2>Race friends online</h2><p>Open Multiplayer to find players or create a private typing room. Share the room code with friends and compare progress in a live race.</p></article>
    </div>
    <h2 style={{marginTop:40}}>How to take a typing test</h2>
    <ol style={{color:"var(--muted)",lineHeight:1.85,paddingLeft:22}}>
      <li>Choose a time limit or word count and a vocabulary level.</li><li>Start typing the displayed text. The timer begins with your input.</li><li>Check your WPM, accuracy and mistakes when the test ends.</li><li>Repeat under the same settings to compare your progress fairly.</li>
    </ol>
    <h2>Typing test questions</h2>
    <h3>What does WPM mean?</h3><p>Words per minute measures typing speed using a standardized word of five characters, including spaces and punctuation. Read <Link href="/how-wpm-is-calculated">how WPM and accuracy are calculated</Link> for the formulas.</p>
    <h3>How can I improve my typing speed?</h3><p>Start with a comfortable pace, correct recurring mistakes, and practice a little each day. Learn finger placement before increasing speed, and compare both accuracy and WPM across similar tests.</p>
    <h3>Is Typeflow free?</h3><p>Yes. You can take typing tests and use the touch typing lessons for free. Sign in to save validated results and review your progress, or use a temporary guest session to try multiplayer.</p>
    <h3>Which typing test duration should I choose?</h3><p>A 15 second test is a quick check. A 60 or 120 second test lets you observe how steadily you maintain your pace. Keep the duration and difficulty the same when comparing scores.</p>
    <p className="learn-link"><Link href="/learn">Start touch typing lessons</Link> · <Link href="/leaderboard">Explore the typing leaderboard</Link> · <Link href="/how-wpm-is-calculated">Understand your typing score</Link></p>
  </section></>;
}
