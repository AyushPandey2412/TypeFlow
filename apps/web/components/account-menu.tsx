"use client";
import type { AuthUser } from "@typing/shared-types";
import { History, LogOut, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function AccountMenu({ user, logout }: { user: AuthUser; logout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return <div className="account-menu" ref={ref}>
    <button className="account-trigger" title="Account" aria-expanded={open} onClick={() => setOpen(value => !value)}><UserRound size={17}/><span>{user.displayName}</span></button>
    {open && <div className="account-popover">
      <div className="account-summary"><span>Signed in as</span><strong>{user.displayName}</strong>{user.email && <small>{user.email}</small>}</div>
      <Link href="/friends" onClick={() => setOpen(false)}><Users size={16}/> Friends</Link>
      <Link href="/history" onClick={() => setOpen(false)}><History size={16}/> Typing history</Link>
      <button onClick={() => void logout()}><LogOut size={16}/> Sign out</button>
    </div>}
  </div>;
}
