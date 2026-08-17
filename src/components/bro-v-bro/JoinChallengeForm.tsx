"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function JoinChallengeForm({ challengeId, inviteToken }: { challengeId: string; inviteToken: string }) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("Rival");
  const [challengeHost, setChallengeHost] = useState<string>("Someone");
  const [firstTo, setFirstTo] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/challenges/${challengeId}?token=${encodeURIComponent(inviteToken)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Invalid invite");
        setChallengeHost(data.challenge.hostName);
        setFirstTo(data.challenge.firstTo);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Invalid invite"));
  }, [challengeId, inviteToken]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inviteToken, opponentName: guestName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to join");
      sessionStorage.setItem(`bvb-guest-token:${challengeId}`, data.participantToken);
      router.push(`/challenge/${challengeId}?token=${encodeURIComponent(data.participantToken)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to join");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0e1016] px-4 py-8 text-[#f1ede4]">
      <form onSubmit={submit} className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[#171a23] p-6 shadow-[10px_10px_0_#8d82ff] sm:p-9">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-[#f2b84b]">You got called out</div>
        <h1 className="mt-3 text-5xl font-black leading-[.92] tracking-[-0.055em]">{challengeHost}<br/><span className="text-white/25">WANTS THE</span><br/>BRO V BRO.</h1>
        <div className="mt-6 inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/60">First to {firstTo}</div>
        <p className="mt-5 text-sm font-semibold leading-6 text-white/50">Join the setup room first. The host builds the official game pool; you can suggest games, suggest rules, and veto picks before either of you ready up.</p>
        <label className="mt-7 block text-xs font-black uppercase tracking-[0.17em] text-white/45">What should we call you?</label>
        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/[.06] px-4 py-4 text-xl font-black outline-none focus:border-[#8d82ff]" />
        {error && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">{error}</div>}
        <button disabled={busy || Boolean(error && error.includes("Invalid invite")) || !guestName.trim()} className="mt-6 w-full rounded-xl bg-[#f2b84b] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#11131a] shadow-[4px_4px_0_#8d82ff] disabled:opacity-40">{busy ? "Joining…" : "Enter setup room"}</button>
      </form>
    </main>
  );
}
