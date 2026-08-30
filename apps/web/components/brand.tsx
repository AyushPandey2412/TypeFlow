import { Keyboard } from "lucide-react";
import Link from "next/link";

export function Brand({ link = true }: { link?: boolean }) {
  const content = <><Keyboard size={19} aria-hidden="true"/><span>Typeflow</span></>;
  return link ? <Link href="/" className="brand" aria-label="Typeflow home" data-tour="brand">{content}</Link> : <div className="brand" data-tour="brand">{content}</div>;
}
