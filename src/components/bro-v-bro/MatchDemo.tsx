"use client";

import { useMemo, useState } from "react";
import { demoGames } from "@/modules/catalog/domain/game";
import {
  applyCoinFlip,
  chooseRandomGame,
  confirmWinner,
  createSession,
  remainingGames,
  selectGame,
  startRound,
} from "@/modules/gauntlet/domain/session";
import type { GauntletSession, PlayerId } from "@/modules/gauntlet/domain/types";
import { GameBadge } from "./GameBadge";

const names: Record<PlayerId, string> = { "player-a": "You", "player-b": "Rival" };

function newSession(): GauntletSession {
  return createSession({
    id: crypto.randomUUID(),
    firstTo: 5,
    eligibleGameIds: demoGames.map((game) => game.id),
    playerAName: names["player-a"],
    playerBName: names["player-b"],
  });
}

export function MatchDemo() {
  const [session, setSession] = useState<GauntletSession>(() => newSession());
  const gameById = useMemo(() => new Map(demoGames.map((game) => [game.id, game])), []);
  const currentGame = session.currentGameId ? gameById.get(session.currentGameId) : undefined;
  const available = remainingGames(session).map((id) => gameById.get(id)!).filter(Boolean);

  function coinFlip() {
    const winner: PlayerId = Math.random() < 0.5 ? "player-a" : "player-b";
    setSession((current) => applyCoinFlip(current, winner));
  }

  function pick(gameId: string) {
    if (!session.selectorId) return;
    setSession((current) => selectGame(current, session.selectorId!, gameId));
  }

  function randomPick() {
    if (!session.selectorId) return;
    const gameId = chooseRandomGame(session);
    setSession((current) => selectGame(current, session.selectorId!, gameId));
  }

  function reportWinner(playerId: PlayerId) {
    setSession((current) => confirmWinner(current, playerId));
  }

  if (session.status === "completed") {
    return <VictoryScreen session={session} onReset={() => setSession(newSession())} />;
  }

  return (
    <main className="min-h-screen bg-[#0e1016] px-4 py-6 text-[#f4f0e8] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#8d82ff]">Bro v Bro / Prototype</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-5xl">You vs Rival</h1>
          </div>
          <button onClick={() => setSession(newSession())} className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/5">Reset</button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.35fr_1fr]">
          <PlayerPanel label={names["player-a"]} score={session.score["player-a"]} active={session.selectorId === "player-a"} side="left" />

          <div className="rounded-[28px] border border-white/10 bg-[#171a23] p-5 shadow-[0_24px_80px_rgba(0,0,0,.32)] sm:p-7">
            <StatusHeader session={session} currentGameName={currentGame?.name} />

            {session.status === "awaiting-coin-flip" && (
              <div className="grid min-h-80 place-items-center text-center">
                <div>
                  <div className="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-full border-4 border-[#171a23] bg-[#f2b84b] text-5xl shadow-[0_0_0_2px_#f2b84b,8px_8px_0_#8d82ff]">◐</div>
                  <h2 className="text-3xl font-black">Who gets first pick?</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/55">Flip once. The result should be persisted by the server in the real implementation so nobody can refresh for a reroll.</p>
                  <button onClick={coinFlip} className="mt-6 rounded-2xl bg-[#8d82ff] px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[4px_4px_0_#f2b84b] transition hover:-translate-y-0.5">Flip coin</button>
                </div>
              </div>
            )}

            {session.status === "selecting-game" && session.selectorId && (
              <div>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Next pick</div>
                    <div className="mt-1 text-2xl font-black"><span className="text-[#f2b84b]">{names[session.selectorId]}</span> chooses</div>
                  </div>
                  <button onClick={randomPick} className="rounded-xl border border-[#8d82ff]/50 bg-[#8d82ff]/10 px-4 py-2 text-sm font-extrabold text-[#bdb6ff] hover:bg-[#8d82ff]/20">🎲 Random</button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {available.map((game) => (
                    <button key={game.id} onClick={() => pick(game.id)} className="group flex min-h-28 flex-col items-start justify-between rounded-2xl border border-white/10 bg-[#10131a] p-3 text-left transition hover:-translate-y-1 hover:border-white/25 hover:bg-[#1c202a]">
                      <GameBadge game={game} />
                      <span className="mt-3 text-sm font-extrabold leading-tight">{game.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {session.status === "round-ready" && currentGame && (
              <div className="grid min-h-80 place-items-center text-center">
                <div>
                  <GameBadge game={currentGame} size="lg" />
                  <h2 className="mt-5 text-4xl font-black tracking-[-0.04em]">{currentGame.name}</h2>
                  <p className="mt-2 text-sm text-white/50">Both players ready? Launch the game however you normally would.</p>
                  <button onClick={() => setSession((current) => startRound(current))} className="mt-7 rounded-2xl bg-[#f4f0e8] px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#11131a] shadow-[4px_4px_0_#8d82ff]">Start round</button>
                </div>
              </div>
            )}

            {session.status === "awaiting-result" && currentGame && (
              <div className="grid min-h-80 place-items-center text-center">
                <div className="w-full max-w-lg">
                  <GameBadge game={currentGame} size="lg" />
                  <h2 className="mt-5 text-3xl font-black">Who won {currentGame.name}?</h2>
                  <div className="mt-7 grid grid-cols-2 gap-3">
                    {(["player-a", "player-b"] as const).map((id) => (
                      <button key={id} onClick={() => reportWinner(id)} className="rounded-2xl border border-white/10 bg-[#10131a] px-4 py-6 text-xl font-black transition hover:border-[#f2b84b] hover:bg-[#1c202a]">{names[id]}</button>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-5 text-white/40">Prototype shortcut: clicking a name represents submit + opponent confirmation. Real MVP will require the opponent to confirm before the score advances.</p>
                </div>
              </div>
            )}
          </div>

          <PlayerPanel label={names["player-b"]} score={session.score["player-b"]} active={session.selectorId === "player-b"} side="right" />
        </section>

        <ResultLedger session={session} />
      </div>
    </main>
  );
}

function StatusHeader({ session, currentGameName }: { session: GauntletSession; currentGameName?: string }) {
  const copy = session.status === "awaiting-coin-flip" ? "Coin flip" : session.status === "selecting-game" ? "Choose next game" : session.status === "round-ready" ? "Game locked" : session.status === "awaiting-result" ? "Round in progress" : "Final";
  return (
    <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
      <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/65">{copy}</span>
      <span className="text-xs font-bold text-white/35">First to {session.format.firstTo}{currentGameName ? ` · ${currentGameName}` : ""}</span>
    </div>
  );
}

function PlayerPanel({ label, score, active, side }: { label: string; score: number; active: boolean; side: "left" | "right" }) {
  return (
    <div className={`rounded-[28px] border p-5 ${active ? "border-[#f2b84b]/60 bg-[#f2b84b]/8" : "border-white/10 bg-[#13161d]"}`}>
      <div className={`flex items-center gap-3 ${side === "right" ? "lg:flex-row-reverse lg:text-right" : ""}`}>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f4f0e8] text-lg font-black text-[#11131a]">{label.slice(0, 2).toUpperCase()}</div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">Player</div>
          <div className="text-xl font-black">{label}</div>
        </div>
      </div>
      <div className={`mt-8 text-7xl font-black tracking-[-0.08em] ${side === "right" ? "lg:text-right" : ""}`}>{score}</div>
      <div className={`mt-2 text-xs font-extrabold uppercase tracking-[0.2em] ${active ? "text-[#f2b84b]" : "text-white/30"}`}>{active ? "Has next pick" : "Waiting"}</div>
    </div>
  );
}

function ResultLedger({ session }: { session: GauntletSession }) {
  if (session.rounds.length === 0) return null;
  return (
    <section className="mt-5 rounded-[24px] border border-white/10 bg-[#13161d] p-5">
      <div className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-white/40">Game ledger</div>
      <div className="grid gap-2">
        {session.rounds.map((round) => {
          const game = demoGames.find((candidate) => candidate.id === round.gameId)!;
          return (
            <div key={round.roundNumber} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-white/[0.035] px-3 py-2">
              <div className={`text-sm font-extrabold ${round.winnerId === "player-a" ? "text-[#7ee2a8]" : "text-white/30"}`}>{round.winnerId === "player-a" ? "✓ " : ""}{names["player-a"]}</div>
              <div className="flex items-center gap-2 text-xs font-bold text-white/60"><GameBadge game={game} size="sm" /><span className="hidden sm:block">{game.name}</span></div>
              <div className={`text-right text-sm font-extrabold ${round.winnerId === "player-b" ? "text-[#7ee2a8]" : "text-white/30"}`}>{names["player-b"]}{round.winnerId === "player-b" ? " ✓" : ""}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function VictoryScreen({ session, onReset }: { session: GauntletSession; onReset: () => void }) {
  const winner = session.winnerId ? names[session.winnerId] : "Winner";
  return (
    <main className="min-h-screen bg-[#0e1016] px-4 py-8 text-[#f4f0e8] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 text-center text-xs font-black uppercase tracking-[0.28em] text-[#f2b84b]">Final · Bro v Bro</div>
        <div className="rounded-[34px] border border-white/10 bg-[#f1ede4] p-5 text-[#11131a] shadow-[10px_10px_0_#8d82ff] sm:p-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4 border-b-2 border-[#11131a] pb-5">
            <div><div className="text-2xl font-black sm:text-4xl">{names["player-a"]}</div><div className="mt-1 text-xs font-bold uppercase tracking-widest opacity-45">Player A</div></div>
            <div className="text-center"><div className="text-xs font-black uppercase tracking-[0.2em] opacity-45">Final</div><div className="text-5xl font-black tracking-[-0.08em] sm:text-7xl">{session.score["player-a"]}–{session.score["player-b"]}</div></div>
            <div className="text-right"><div className="text-2xl font-black sm:text-4xl">{names["player-b"]}</div><div className="mt-1 text-xs font-bold uppercase tracking-widest opacity-45">Player B</div></div>
          </div>

          <div className="my-6 text-center"><div className="text-sm font-black uppercase tracking-[0.2em] opacity-45">Series winner</div><div className="mt-1 text-4xl font-black tracking-[-0.04em] text-[#6c5ce7]">{winner}</div></div>

          <div className="grid gap-2">
            {session.rounds.map((round) => {
              const game = demoGames.find((candidate) => candidate.id === round.gameId)!;
              return (
                <div key={round.roundNumber} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-black/10 py-3">
                  <div className={`text-lg font-black ${round.winnerId === "player-a" ? "opacity-100" : "opacity-20"}`}>{round.winnerId === "player-a" ? "✓" : ""}</div>
                  <div className="flex min-w-0 items-center gap-3"><GameBadge game={game} size="sm" /><span className="truncate text-sm font-extrabold sm:text-base">{game.name}</span></div>
                  <div className={`text-right text-lg font-black ${round.winnerId === "player-b" ? "opacity-100" : "opacity-20"}`}>{round.winnerId === "player-b" ? "✓" : ""}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3 border-t-2 border-[#11131a] pt-5">
            <button className="rounded-xl bg-[#11131a] px-5 py-3 text-sm font-black text-[#f4f0e8]">Share victory card</button>
            <button onClick={onReset} className="rounded-xl border-2 border-[#11131a] px-5 py-3 text-sm font-black">Run it back</button>
          </div>
        </div>
      </div>
    </main>
  );
}
