"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateChallengeForm() {
  const router = useRouter();
  const [hostName, setHostName] = useState("You");
  const [firstTo, setFirstTo] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hostName, firstTo }),
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
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
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

        {error && <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">{error}</div>}
        <button disabled={busy || !hostName.trim()} className="mt-7 w-full rounded-xl bg-[#8d82ff] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[4px_4px_0_#f2b84b] disabled:opacity-40">
          {busy ? "Creating…" : "Create Bro v Bro"}
        </button>
      </section>

      <section className="rounded-[28px] border-2 border-[#11131a] bg-[#f1ede4] p-6 sm:p-8">
        <div className="text-xs font-black uppercase tracking-[0.2em] opacity-45">Configure together</div>
        <h2 className="mt-2 max-w-lg text-4xl font-black leading-[.95] tracking-[-0.045em]">Invite first. Build the matchup second.</h2>
        <p className="mt-5 max-w-xl text-base font-semibold leading-7 opacity-65">Once your rival joins, you choose the official pool. They can suggest games, suggest rulesets, and veto anything they do not want to play. Nothing starts until both players ready up.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            ["01", "Send the invite", "Get both players into the same setup room."],
            ["02", "Build the pool", "Add curated 1v1 challenges and edit their rules."],
            ["03", "Veto + suggest", "Your rival can push back without editing your list."],
            ["04", "Ready up", "Both approve the final pool before the coin flip."],
          ].map(([number, title, copy]) => (
            <div key={number} className="rounded-2xl border-2 border-[#11131a] bg-white/45 p-4 shadow-[3px_3px_0_#11131a]">
              <div className="text-xs font-black text-[#8d82ff]">{number}</div>
              <div className="mt-3 text-lg font-black">{title}</div>
              <div className="mt-1 text-sm font-semibold leading-5 opacity-55">{copy}</div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
