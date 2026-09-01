"use client";
import type { RaceOptions } from "../services/friend.service";
import { friendService, type Invite } from "../services/friend.service";
import { useEffect, useState } from "react";

export function InviteNotifications({ enabled, onAccept }: { enabled: boolean; onAccept: (code: string, options: RaceOptions) => void }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  useEffect(() => {
    if (!enabled) { setInvites([]); return; }
    let active = true;
    const load = () => friendService.invites().then(value => { if (active) setInvites(value.invites); }).catch(() => undefined);
    void load();
    const timer = setInterval(load, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [enabled]);
  const invite = invites[0];
  if (!invite) return null;
  async function act(action: "accept" | "reject") {
    const result = await friendService.respond(invite.code, action);
    setInvites(values => values.filter(value => value.code !== invite.code));
    if (action === "accept") onAccept(result.code || invite.code, result.options || invite.options);
  }
  return <aside className="race-invite" role="status">
    <div><strong>{invite.from.displayName} invited you to race</strong><span>{invite.options.wordCount} words · {invite.options.playerCount} players · {invite.options.mode}</span></div>
    <div><button className="secondary" onClick={() => void act("reject")}>Reject</button><button className="primary" onClick={() => void act("accept")}>Accept</button></div>
  </aside>;
}
