"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { demoGames } from "@/modules/catalog/domain/game";
import type { GauntletSession, PlayerId } from "@/modules/gauntlet/domain/types";
import type { SessionCommand } from "@/modules/gauntlet/application/commands";
import { GameBadge } from "./GameBadge";

export function LiveMatch({ sessionId, token }: { sessionId: string; token: string }) {
  const [session, setSession] = useState<GauntletSession | null>(null);
  const [me, setMe] = useState<PlayerId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const games = useMemo(() => new Map(demoGames.map((game) => [game.id, game])), []);

  const load = useCallback(async () => {
    const response = await fetch(`/api/sessions/${sessionId}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load match");
    setSession(data.session);
    setMe(data.playerId);
  }, [sessionId, token]);

  useEffect(() => {
    let stopped = false;
    async function refresh() {
      try { if (!stopped) await load(); }
      catch (cause) { if (!stopped) setError(cause instanceof Error ? cause.message : "Unable to load match"); }
    }
    refresh();
    const timer = window.setInterval(refresh, 1200);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [load]);

  async function command(command: SessionCommand) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${session.id}/commands`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          expectedVersion: session.version,
          idempotencyKey: crypto.randomUUID(),
          command,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) await load();
        throw new Error(data.error ?? "Command failed");
      }
      setSession(data.session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Command failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !session) return <main className="grid min-h-screen place-items-center bg-[#0e1016] text-white"><div className="text-center"><div className="text-2xl font-black">{error}</div><Link href="/" className="mt-4 inline-block text-[#f2b84b]">Back home</Link></div></main>;
  if (!session || !me) return <main className="grid min-h-screen place-items-center bg-[#0e1016] text-white"><div className="animate-pulse text-xl font-black">Entering the arena…</div></main>;
  if (session.status === "completed") return <NetworkVictoryScreen session={session} token={token} />;

  const currentGame = session.currentGameId ? games.get(session.currentGameId) : undefined;
  const available = session.eligibleGameIds.filter((id) => !session.usedGameIds.includes(id)).map((id) => games.get(id)).filter(Boolean);
  const myTurn = session.selectorId === me;
  const opponent = me === "player-a" ? "player-b" : "player-a";
  const pending = session.pendingResult;

  return (
    <main className="min-h-screen bg-[#0e1016] px-4 py-5 text-[#f4f0e8] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <div><div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8d82ff]">Bro v Bro · Live</div><h1 className="mt-1 text-2xl font-black tracking-[-0.045em] sm:text-4xl">{session.players[0].displayName} vs {session.players[1].displayName}</h1></div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">You are {session.players.find((p) => p.id === me)?.displayName}</div>
        </header>

        {error && <div className="mb-4 rounded-xl border border-[#f2b84b]/30 bg-[#f2b84b]/10 px-4 py-3 text-sm font-bold text-[#f2b84b]">{error}</div>}

        <section className="grid gap-4 lg:grid-cols-[.8fr_1.4fr_.8fr]">
          <ScorePanel player={session.players[0]} score={session.score["player-a"]} active={session.selectorId === "player-a"} me={me === "player-a"} />

          <section className="min-h-[440px] rounded-[28px] border border-white/10 bg-[#171a23] p-5 shadow-[0_24px_80px_rgba(0,0,0,.32)] sm:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4"><span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">{statusLabel(session.status)}</span><span className="text-xs font-bold text-white/35">First to {session.format.firstTo} · v{session.version}</span></div>

            {session.status === "awaiting-coin-flip" && <Centered><div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#f2b84b] text-5xl text-[#11131a] shadow-[7px_7px_0_#8d82ff]">◐</div><h2 className="mt-6 text-3xl font-black">Flip for first pick.</h2><p className="mt-2 text-sm text-white/45">One flip. Persisted. No refresh cheese.</p><button disabled={busy} onClick={() => command({ type: "FLIP_FOR_FIRST_PICK" })} className="mt-6 rounded-xl bg-[#8d82ff] px-6 py-4 text-sm font-black uppercase tracking-[0.15em] shadow-[4px_4px_0_#f2b84b]">Flip coin</button></Centered>}

            {session.status === "selecting-game" && session.selectorId && (
              <div>
                <div className="mb-5 flex items-end justify-between"><div><div className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Next pick</div><h2 className="mt-1 text-3xl font-black"><span className="text-[#f2b84b]">{session.players.find((p) => p.id === session.selectorId)?.displayName}</span> chooses</h2></div>{myTurn && <button disabled={busy} onClick={() => command({ type: "SELECT_RANDOM_GAME" })} className="rounded-xl border border-[#8d82ff]/50 bg-[#8d82ff]/10 px-4 py-2 text-sm font-black text-[#bdb6ff]">🎲 Random</button>}</div>
                {!myTurn && <div className="mb-4 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-bold text-white/45">Waiting for your rival to counter-pick…</div>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{available.map((game) => game && <button disabled={!myTurn || busy} key={game.id} onClick={() => command({ type: "SELECT_GAME", gameId: game.id })} className="flex min-h-28 flex-col items-start justify-between rounded-2xl border border-white/10 bg-[#10131a] p-3 text-left transition enabled:hover:-translate-y-1 enabled:hover:border-[#f2b84b]/60 disabled:opacity-40"><GameBadge game={game}/><span className="mt-3 text-sm font-black leading-tight">{game.name}</span></button>)}</div>
              </div>
            )}

            {session.status === "round-ready" && currentGame && <Centered><GameBadge game={currentGame} size="lg"/><h2 className="mt-5 text-4xl font-black tracking-[-0.045em]">{currentGame.name}</h2><p className="mt-2 text-sm text-white/45">Launch it however you normally would, then start the round.</p>{currentGame.launchUrl && <a className="mt-4 inline-block text-sm font-black text-[#bdb6ff] underline" target="_blank" href={currentGame.launchUrl}>Open {currentGame.name} ↗</a>}<br/><button disabled={busy} onClick={() => command({ type: "START_ROUND" })} className="mt-6 rounded-xl bg-[#f1ede4] px-6 py-4 text-sm font-black uppercase tracking-[0.15em] text-[#11131a] shadow-[4px_4px_0_#8d82ff]">Start round</button></Centered>}

            {session.status === "awaiting-result" && currentGame && <Centered><GameBadge game={currentGame} size="lg"/><h2 className="mt-5 text-3xl font-black">Who won {currentGame.name}?</h2><div className="mt-6 grid w-full max-w-lg grid-cols-2 gap-3">{session.players.map((player) => <button disabled={busy} key={player.id} onClick={() => command({ type: "REPORT_RESULT", winnerId: player.id })} className="rounded-2xl border border-white/10 bg-[#10131a] px-4 py-6 text-xl font-black hover:border-[#f2b84b]">{player.displayName}</button>)}</div><p className="mt-4 text-xs text-white/35">Your rival must confirm before the score moves.</p></Centered>}

            {session.status === "awaiting-result-confirmation" && pending && <Centered><div className="text-xs font-black uppercase tracking-[0.2em] text-[#f2b84b]">Result reported</div><h2 className="mt-3 text-4xl font-black">{session.players.find((p) => p.id === pending.winnerId)?.displayName} won.</h2><p className="mt-3 text-sm text-white/45">Reported by {session.players.find((p) => p.id === pending.reportedBy)?.displayName}.</p>{pending.reportedBy === me ? <div className="mt-6 rounded-xl border border-white/10 bg-white/[.04] px-5 py-4 text-sm font-bold text-white/50">Waiting on {session.players.find((p) => p.id === opponent)?.displayName} to confirm…</div> : <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3"><button disabled={busy} onClick={() => command({ type: "DISPUTE_RESULT" })} className="rounded-xl border border-white/15 px-5 py-4 text-sm font-black">Nope</button><button disabled={busy} onClick={() => command({ type: "CONFIRM_RESULT" })} className="rounded-xl bg-[#7ee2a8] px-5 py-4 text-sm font-black text-[#11131a] shadow-[4px_4px_0_#8d82ff]">Confirm</button></div>}</Centered>}
          </section>

          <ScorePanel player={session.players[1]} score={session.score["player-b"]} active={session.selectorId === "player-b"} me={me === "player-b"} right />
        </section>

        <LiveLedger session={session}/>
      </div>
    </main>
  );
}

function ScorePanel({ player, score, active, me, right = false }: { player: GauntletSession["players"][number]; score: number; active: boolean; me: boolean; right?: boolean }) {
  return <aside className={`rounded-[28px] border p-5 ${active ? "border-[#f2b84b]/60 bg-[#f2b84b]/[.07]" : "border-white/10 bg-[#13161d]"}`}><div className={`flex items-center gap-3 ${right ? "lg:flex-row-reverse lg:text-right" : ""}`}><div className="grid h-14 w-14 place-items-center rounded-full bg-[#f1ede4] text-lg font-black text-[#11131a]">{player.initials}</div><div><div className="text-[10px] font-black uppercase tracking-[0.17em] text-white/35">{me ? "You" : "Rival"}</div><div className="text-xl font-black">{player.displayName}</div></div></div><div className={`mt-7 text-7xl font-black tracking-[-0.08em] ${right ? "lg:text-right" : ""}`}>{score}</div><div className={`mt-2 text-xs font-black uppercase tracking-[0.18em] ${active ? "text-[#f2b84b]" : "text-white/25"}`}>{active ? "Has next pick" : ""}</div></aside>;
}

function LiveLedger({ session }: { session: GauntletSession }) {
  if (!session.rounds.length) return null;
  return <section className="mt-5 rounded-[24px] border border-white/10 bg-[#13161d] p-5"><div className="mb-4 flex items-center justify-between"><div className="text-xs font-black uppercase tracking-[0.2em] text-white/35">Game ledger</div><div className="text-xs font-bold text-white/30">{session.rounds.length} complete</div></div><div className="grid gap-2">{session.rounds.map((round) => { const game = demoGames.find((g) => g.id === round.gameId); if (!game) return null; return <div key={round.roundNumber} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-white/[.035] px-3 py-2"><div className={`text-sm font-black ${round.winnerId === "player-a" ? "text-[#7ee2a8]" : "text-white/25"}`}>{round.winnerId === "player-a" ? "✓ " : ""}{session.players[0].displayName}</div><div className="flex items-center gap-2"><GameBadge game={game} size="sm"/><span className="hidden text-xs font-bold text-white/55 sm:block">{game.name}</span></div><div className={`text-right text-sm font-black ${round.winnerId === "player-b" ? "text-[#7ee2a8]" : "text-white/25"}`}>{session.players[1].displayName}{round.winnerId === "player-b" ? " ✓" : ""}</div></div>; })}</div></section>;
}

function NetworkVictoryScreen({ session, token }: { session: GauntletSession; token: string }) {
  const winner = session.players.find((player) => player.id === session.winnerId);
  const shareCardUrl = `/api/sessions/${session.id}/share-card?token=${encodeURIComponent(token)}`;
  return <main className="min-h-screen bg-[#0e1016] px-4 py-8 text-[#f1ede4]"><div className="mx-auto max-w-4xl"><div className="mb-4 text-center text-xs font-black uppercase tracking-[0.26em] text-[#f2b84b]">Final · Bro v Bro</div><div className="rounded-[34px] border border-white/10 bg-[#e9e3d8] p-5 text-[#11131a] shadow-[10px_10px_0_#8d82ff] sm:p-8"><div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4 border-b-2 border-[#11131a] pb-5"><div><div className="text-2xl font-black sm:text-4xl">{session.players[0].displayName}</div></div><div className="text-center"><div className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Final</div><div className="text-5xl font-black tracking-[-0.08em] sm:text-7xl">{session.score["player-a"]}–{session.score["player-b"]}</div></div><div className="text-right text-2xl font-black sm:text-4xl">{session.players[1].displayName}</div></div><div className="my-6 text-center"><div className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Series winner</div><div className="mt-1 text-4xl font-black tracking-[-0.045em] text-[#6c5ce7]">{winner?.displayName}</div></div><div className="grid gap-1">{session.rounds.map((round) => { const game = demoGames.find((g) => g.id === round.gameId); if (!game) return null; return <div key={round.roundNumber} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-black/10 py-3"><div className={`text-xl font-black ${round.winnerId === "player-a" ? "opacity-100" : "opacity-15"}`}>{round.winnerId === "player-a" ? "✓" : "—"}</div><div className="flex items-center gap-3"><GameBadge game={game} size="sm"/><span className="text-sm font-black sm:text-base">{game.name}</span></div><div className={`text-right text-xl font-black ${round.winnerId === "player-b" ? "opacity-100" : "opacity-15"}`}>{round.winnerId === "player-b" ? "✓" : "—"}</div></div>; })}</div><div className="mt-7 flex flex-wrap justify-center gap-3 border-t-2 border-[#11131a] pt-5"><a href={shareCardUrl} target="_blank" className="rounded-xl bg-[#11131a] px-5 py-3 text-sm font-black text-[#f1ede4]">Open share card</a><Link href="/challenge/new" className="rounded-xl border-2 border-[#11131a] px-5 py-3 text-sm font-black">Run another</Link></div></div></div></main>;
}

function Centered({ children }: { children: React.ReactNode }) { return <div className="grid min-h-80 place-items-center text-center"><div className="w-full">{children}</div></div>; }
function statusLabel(status: GauntletSession["status"]) { return ({ "awaiting-coin-flip": "Coin flip", "selecting-game": "Choose next game", "round-ready": "Game locked", "awaiting-result": "Round live", "awaiting-result-confirmation": "Confirm result", completed: "Final" } satisfies Record<GauntletSession["status"], string>)[status]; }
