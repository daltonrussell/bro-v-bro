"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { demoGames } from "@/modules/catalog/domain/game";
import { GameBadge } from "./GameBadge";

export function CreateChallengeForm() {
  const router = useRouter();
  const [hostName, setHostName] = useState("You");
  const [firstTo, setFirstTo] = useState(5);
  const [selected, setSelected] = useState<string[]>(() => demoGames.map((game) => game.id));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const minGames = useMemo(() => Math.max(firstTo, firstTo * 2 - 1), [firstTo]);

  function toggle(gameId: string) {
    setSelected((current) => current.includes(gameId) ? current.filter((id) => id !== gameId) : [...current, gameId]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hostName, firstTo, gameIds: selected }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create challenge");
      sessionStorage.setItem(`bvb-host-token:${data.challenge.id}`, data.hostToken);
      sessionStorage.setItem(`bvb-invite-token:${data.challenge.id}`, data.inviteToken);
      router.push(`/challenge/${data.challenge.id}?token=${encodeURIComponent(data.hostToken)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create challenge");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
      <section className="rounded-[28px] border-2 border-[#11131a] bg-[#11131a] p-6 text-[#f1ede4] shadow-[8px_8px_0_#8d82ff]">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-[#f2b84b]">New matchup</div>
        <h1 className="mt-2 text-5xl font-black leading-[.9] tracking-[-0.055em]">CALL<br/>YOUR<br/>SHOT.</h1>

        <label className="mt-8 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Your name</label>
        <input value={hostName} onChange={(e) => setHostName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-lg font-black outline-none focus:border-[#8d82ff]" />

        <div className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-white/45">Series</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[3, 4, 5].map((score) => (
            <button key={score} type="button" onClick={() => setFirstTo(score)} className={`rounded-xl border px-3 py-3 text-sm font-black ${firstTo === score ? "border-[#f2b84b] bg-[#f2b84b] text-[#11131a]" : "border-white/15 bg-white/[.04]"}`}>
              First to {score}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-white/40">A first-to-{firstTo} can take up to {firstTo * 2 - 1} different games. Pick at least {minGames} if you want to guarantee no repeats.</p>

        {error && <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">{error}</div>}
        <button disabled={busy || selected.length < minGames} className="mt-7 w-full rounded-xl bg-[#8d82ff] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[4px_4px_0_#f2b84b] disabled:opacity-40">
          {busy ? "Creating…" : "Create Bro v Bro"}
        </button>
      </section>

      <section className="rounded-[28px] border-2 border-[#11131a] bg-[#f1ede4] p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4 border-b-2 border-[#11131a] pb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] opacity-45">Game pool</div>
            <div className="mt-1 text-3xl font-black tracking-[-0.045em]">What can you play?</div>
          </div>
          <div className="rounded-full bg-[#11131a] px-3 py-1 text-xs font-black text-[#f1ede4]">{selected.length} selected</div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {demoGames.map((game) => {
            const active = selected.includes(game.id);
            return (
              <button key={game.id} type="button" onClick={() => toggle(game.id)} className={`relative flex min-h-36 flex-col items-start justify-between rounded-2xl border-2 p-4 text-left transition ${active ? "border-[#11131a] bg-white shadow-[4px_4px_0_#11131a] -translate-y-0.5" : "border-black/15 bg-black/[.03] opacity-45"}`}>
                <div className="flex w-full items-start justify-between gap-2"><GameBadge game={game} /><span className={`grid h-6 w-6 place-items-center rounded-full border-2 text-xs font-black ${active ? "border-[#11131a] bg-[#7ee2a8]" : "border-black/25"}`}>{active ? "✓" : ""}</span></div>
                <div><div className="text-base font-black leading-tight">{game.name}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] opacity-45">{game.source}</div></div>
              </button>
            );
          })}
        </div>
      </section>
    </form>
  );
}
