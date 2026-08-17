"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { demoGames } from "@/modules/catalog/domain/game";
import { GameBadge } from "./GameBadge";

type Challenge = {
  id: string;
  hostName: string;
  opponentName: string | null;
  firstTo: number;
  gameIds: string[];
  sessionId: string | null;
};

export function ChallengeLobby({ challengeId, token }: { challengeId: string; token: string }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inviteToken = typeof window !== "undefined" ? sessionStorage.getItem(`bvb-invite-token:${challengeId}`) ?? "" : "";
  const inviteUrl = useMemo(() => typeof window !== "undefined" && inviteToken ? `${window.location.origin}/join/${challengeId}?invite=${encodeURIComponent(inviteToken)}` : "", [challengeId, inviteToken]);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      try {
        const response = await fetch(`/api/challenges/${challengeId}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load challenge");
        if (!stopped) setChallenge(data.challenge);
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : "Unable to load challenge");
      }
    }
    poll();
    const timer = window.setInterval(poll, 1500);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [challengeId, token]);

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  if (error) return <LobbyShell><div className="text-xl font-black">{error}</div></LobbyShell>;
  if (!challenge) return <LobbyShell><div className="animate-pulse text-xl font-black">Loading challenge…</div></LobbyShell>;

  return (
    <LobbyShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <section className="rounded-[28px] border-2 border-[#11131a] bg-[#11131a] p-6 text-[#f1ede4] shadow-[8px_8px_0_#8d82ff]">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-[#f2b84b]">Challenge lobby</div>
          <h1 className="mt-2 text-5xl font-black tracking-[-0.055em]">{challenge.hostName}<br/><span className="text-white/25">VS</span><br/>{challenge.opponentName ?? "???"}</h1>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[.06] p-4"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Format</div><div className="mt-1 text-xl font-black">First to {challenge.firstTo}</div></div>
            <div className="rounded-xl bg-white/[.06] p-4"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Pool</div><div className="mt-1 text-xl font-black">{challenge.gameIds.length} games</div></div>
          </div>

          {!challenge.sessionId ? (
            <div className="mt-7 rounded-2xl border border-[#f2b84b]/30 bg-[#f2b84b]/10 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#f2b84b]">Waiting for rival</div>
              <p className="mt-2 text-sm leading-6 text-white/55">Send the invite. This page will update as soon as they join.</p>
              {inviteUrl ? <button onClick={copyInvite} className="mt-4 w-full rounded-xl bg-[#f1ede4] px-4 py-3 text-sm font-black text-[#11131a]">{copied ? "Copied" : "Copy invite link"}</button> : <div className="mt-4 text-xs text-white/40">Invite token is only shown on the browser that created the challenge.</div>}
            </div>
          ) : (
            <Link href={`/match/${challenge.sessionId}?token=${encodeURIComponent(token)}`} className="mt-7 block rounded-xl bg-[#7ee2a8] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[#11131a] shadow-[4px_4px_0_#f2b84b]">Enter the arena</Link>
          )}
        </section>

        <section className="rounded-[28px] border-2 border-[#11131a] bg-[#f1ede4] p-5">
          <div className="border-b-2 border-[#11131a] pb-3 text-xs font-black uppercase tracking-[0.2em] opacity-45">Confirmed game pool</div>
          <div className="mt-4 grid gap-2">
            {challenge.gameIds.map((id) => {
              const game = demoGames.find((candidate) => candidate.id === id);
              return game ? <div key={id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/50 p-3"><GameBadge game={game} /><div className="font-black">{game.name}</div></div> : null;
            })}
          </div>
        </section>
      </div>
    </LobbyShell>
  );
}

function LobbyShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#e9e3d8] px-4 py-6 text-[#11131a] sm:px-8"><div className="mx-auto max-w-5xl"><header className="mb-6 flex justify-between border-b-2 border-[#11131a] pb-4"><Link href="/" className="font-black">BRO / V / BRO</Link><span className="text-xs font-black uppercase tracking-[0.18em] opacity-45">Live lobby</span></header>{children}</div></main>;
}
