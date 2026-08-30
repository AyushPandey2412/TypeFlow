import Link from "next/link";
import { Brand } from "./brand";

export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-inner"><div className="footer-summary"><Brand/><p>Focused typing practice, accurate performance metrics, and live races with friends.</p></div><div className="footer-links"><div><strong>Practice</strong><Link href="/">Typing test</Link><Link href="/learn">Learn touch typing</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/how-wpm-is-calculated">WPM guide</Link></div><div><strong>Company</strong><Link href="/about">About</Link><Link href="/contact">Contact</Link></div><div><strong>Legal</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Typeflow</span><span>Built for deliberate typing practice.</span></div></footer>;
}
