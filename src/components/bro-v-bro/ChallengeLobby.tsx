"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { demoGames } from "@/modules/catalog/domain/game";
import { demoChallengePresets, formatChallengeSelection, getRuleVariant } from "@/modules/catalog/domain/challenge-preset";
import { demoTemplates } from "@/modules/catalog/domain/template";
import type { Challenge as ChallengeState } from "@/modules/challenge/domain/types";
import { maximumRounds } from "@/modules/challenge/domain/setup";
import type { ChallengeCommand, ChallengeViewerRole } from "@/modules/challenge/application/challenge-service";
import { GameBadge } from "./GameBadge";

export function ChallengeLobby({ challengeId, token }: { challengeId: string; token: string }) {
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [viewerRole, setViewerRole] = useState<ChallengeViewerRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inviteToken = typeof window !== "undefined" ? sessionStorage.getItem(`bvb-invite-token:${challengeId}`) ?? "" : "";
  const inviteUrl = useMemo(() => typeof window !== "undefined" && inviteToken ? `${window.location.origin}/join/${challengeId}?invite=${encodeURIComponent(inviteToken)}` : "", [challengeId, inviteToken]);

  async function load() {
    const response = await fetch(`/api/challenges/${challengeId}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load challenge");
    setChallenge(data.challenge);
    setViewerRole(data.viewerRole);
  }

  useEffect(() => {
    let stopped = false;
    async function poll() {
      try {
        const response = await fetch(`/api/challenges/${challengeId}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load challenge");
        if (!stopped) {
          setChallenge(data.challenge);
          setViewerRole(data.viewerRole);
          setError(null);
        }
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : "Unable to load challenge");
      }
    }
    poll();
    const timer = window.setInterval(poll, 1500);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [challengeId, token]);

  async function command(commandValue: ChallengeCommand, key: string) {
    setBusy(key);
    setError(null);
    try {
      const response = await fetch(`/api/challenges/${challengeId}/commands`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, command: commandValue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update challenge");
      setChallenge(data.challenge);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update challenge");
    } finally {
      setBusy(null);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  if (error && !challenge) return <LobbyShell><div className="text-xl font-black">{error}</div></LobbyShell>;
  if (!challenge || !viewerRole) return <LobbyShell><div className="animate-pulse text-xl font-black">Loading challenge…</div></LobbyShell>;

  const isHost = viewerRole === "host";
  const isGuest = viewerRole === "guest";
  const requiredPoolSize = maximumRounds(challenge.firstTo);
  const hasVeto = challenge.pool.some((item) => item.guestVetoed);
  const readyToStart = Boolean(challenge.opponentName) && challenge.pool.length >= requiredPoolSize && !hasVeto && challenge.hostReady && challenge.guestReady;
  const poolPresetIds = new Set(challenge.pool.map((item) => item.presetId));
  const suggestions = demoChallengePresets
    .filter((preset) => !poolPresetIds.has(preset.id))
    .filter((preset) => preset.suitability === "featured" || preset.suitability === "recommended")
    .sort((a, b) => Number(b.suitability === "featured") - Number(a.suitability === "featured") || a.name.localeCompare(b.name));
  const sourceTemplate = demoTemplates.find((template) => template.id === challenge.sourceTemplateId);

  if (viewerRole === "invitee") {
    return <LobbyShell><div className="rounded-3xl border-2 border-[#11131a] bg-[#f1ede4] p-8"><div className="text-3xl font-black">Use the invite page to join this Bro v Bro.</div></div></LobbyShell>;
  }

  return (
    <LobbyShell>
      <div className="grid gap-6 xl:grid-cols-[.72fr_1.28fr]">
        <aside className="space-y-5">
          <section className="rounded-[28px] border-2 border-[#11131a] bg-[#11131a] p-6 text-[#f1ede4] shadow-[8px_8px_0_#8d82ff]">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#f2b84b]">Setup room</div>
            <h1 className="mt-2 text-5xl font-black leading-[.9] tracking-[-0.055em]">{challenge.hostName}<br/><span className="text-white/25">VS</span><br/>{challenge.opponentName ?? "???"}</h1>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <Stat label="Format" value={`First to ${challenge.firstTo}`} />
              <Stat label="Pool" value={`${challenge.pool.length} / ${requiredPoolSize}`} />
            </div>
            {sourceTemplate && <div className="mt-3 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-bold text-white/55">Started from <span className="text-white">{sourceTemplate.name}</span>. The pool is fully editable.</div>}

            {!challenge.opponentName && isHost && (
              <div className="mt-7 rounded-2xl border border-[#f2b84b]/30 bg-[#f2b84b]/10 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#f2b84b]">Waiting for rival</div>
                <p className="mt-2 text-sm leading-6 text-white/55">Send the invite. Configure the pool once they are here.</p>
                {inviteUrl ? <button onClick={copyInvite} className="mt-4 w-full rounded-xl bg-[#f1ede4] px-4 py-3 text-sm font-black text-[#11131a]">{copied ? "Copied" : "Copy invite link"}</button> : null}
              </div>
            )}

            {challenge.opponentName && challenge.status !== "started" && (
              <div className="mt-7 space-y-3">
                <ReadinessRow label={challenge.hostName} ready={challenge.hostReady} you={isHost} />
                <ReadinessRow label={challenge.opponentName} ready={challenge.guestReady} you={isGuest} />
                <button
                  onClick={() => command({ type: "ready", ready: isHost ? !challenge.hostReady : !challenge.guestReady }, "ready")}
                  disabled={busy !== null || hasVeto || challenge.pool.length < requiredPoolSize}
                  className="w-full rounded-xl bg-[#f1ede4] px-4 py-3 text-sm font-black text-[#11131a] disabled:opacity-35"
                >
                  {(isHost ? challenge.hostReady : challenge.guestReady) ? "Not ready" : "Ready up"}
                </button>
                {isHost && (
                  <button
                    onClick={() => command({ type: "start" }, "start")}
                    disabled={busy !== null || !readyToStart}
                    className="w-full rounded-xl bg-[#7ee2a8] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#11131a] shadow-[4px_4px_0_#f2b84b] disabled:opacity-30"
                  >
                    Start Bro v Bro
                  </button>
                )}
              </div>
            )}

            {challenge.status === "started" && challenge.sessionId && (
              <Link href={`/match/${challenge.sessionId}?token=${encodeURIComponent(token)}`} className="mt-7 block rounded-xl bg-[#7ee2a8] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[#11131a] shadow-[4px_4px_0_#f2b84b]">Enter the arena</Link>
            )}
          </section>

          {challenge.proposals.length > 0 && (
            <section className="rounded-[24px] border-2 border-[#11131a] bg-[#f2b84b] p-5 shadow-[5px_5px_0_#11131a]">
              <div className="text-xs font-black uppercase tracking-[0.18em] opacity-55">{isHost ? "Rival suggested" : "Your suggestions"}</div>
              <div className="mt-3 space-y-2">
                {challenge.proposals.map((proposal) => {
                  const preset = demoChallengePresets.find((candidate) => candidate.id === proposal.presetId);
                  if (!preset) return null;
                  const variant = getRuleVariant(preset, proposal.ruleVariantId);
                  const text = proposal.type === "add-challenge"
                    ? formatChallengeSelection(preset, proposal.ruleVariantId)
                    : `${preset.name} → ${variant.label}`;
                  return (
                    <div key={proposal.id} className="rounded-xl border-2 border-[#11131a] bg-[#f1ede4] p-3">
                      <div className="text-sm font-black">{text}</div>
                      {isHost && <div className="mt-2 flex gap-2"><SmallButton onClick={() => command({ type: "accept-proposal", proposalId: proposal.id }, `accept-${proposal.id}`)}>Add / accept</SmallButton><SmallButton onClick={() => command({ type: "dismiss-proposal", proposalId: proposal.id }, `dismiss-${proposal.id}`)}>Dismiss</SmallButton></div>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </aside>

        <div className="space-y-6">
          <section className="rounded-[28px] border-2 border-[#11131a] bg-[#11131a] p-5 text-[#f1ede4] sm:p-7">
            <div className="flex items-end justify-between gap-4 border-b border-white/15 pb-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-[#f2b84b]">Start from a template</div>
                <div className="mt-1 text-3xl font-black tracking-[-0.045em]">Play a known Bro v Bro.</div>
              </div>
              <div className="hidden text-right text-xs font-bold text-white/35 sm:block">Templates seed the pool.<br/>You can edit everything.</div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {demoTemplates.map((template) => {
                const active = challenge.sourceTemplateId === template.id;
                return (
                  <div key={template.id} className={`rounded-2xl border p-4 ${active ? "border-[#f2b84b] bg-[#f2b84b]/10" : "border-white/15 bg-white/[.04]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[.15em] text-white/35">{template.type.replaceAll("-", " ")}</div>
                        <div className="mt-1 text-xl font-black">{template.name}</div>
                      </div>
                      <div className="rounded-full border border-white/15 px-2 py-1 text-[10px] font-black text-white/55">{template.challengePresetIds.length} games</div>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-white/45">{template.description}</p>
                    {isHost ? (
                      <button
                        disabled={busy !== null || !challenge.opponentName}
                        onClick={() => command({ type: "apply-template", templateId: template.id }, `template-${template.id}`)}
                        className="mt-4 w-full rounded-xl bg-[#f1ede4] px-3 py-2 text-xs font-black text-[#11131a] disabled:opacity-30"
                      >{active ? "Reapply template" : challenge.pool.length > 0 ? "Use template · replaces pool" : "Use template"}</button>
                    ) : (
                      <div className="mt-4 text-xs font-bold text-white/35">Host can apply this template.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border-2 border-[#11131a] bg-[#f1ede4] p-5 sm:p-7">
            <div className="flex items-end justify-between gap-4 border-b-2 border-[#11131a] pb-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] opacity-45">Official pool</div>
                <div className="mt-1 text-3xl font-black tracking-[-0.045em]">{isHost ? "You make the call." : "Host makes the call."}</div>
              </div>
              <div className="rounded-full bg-[#11131a] px-3 py-1 text-xs font-black text-[#f1ede4]">{challenge.pool.length} games</div>
            </div>

            {challenge.pool.length === 0 ? (
              <div className="mt-5 rounded-2xl border-2 border-dashed border-black/20 p-8 text-center">
                <div className="text-xl font-black">No games yet.</div>
                <div className="mt-1 text-sm font-semibold opacity-50">{isHost ? "Use a template or add challenges from the suggestions below." : "Suggest something to the host below."}</div>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {challenge.pool.map((item) => {
                  const preset = demoChallengePresets.find((candidate) => candidate.id === item.presetId);
                  if (!preset) return null;
                  const game = demoGames.find((candidate) => candidate.id === preset.gameId);
                  const variant = getRuleVariant(preset, item.ruleVariantId);
                  return (
                    <div key={item.presetId} className={`rounded-2xl border-2 p-4 ${item.guestVetoed ? "border-[#d84444] bg-[#d84444]/10" : "border-[#11131a] bg-white/50"}`}>
                      <div className="flex gap-3">
                        {game && <GameBadge game={game} />}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-lg font-black">{preset.name}</div>
                            {item.guestVetoed && <span className="rounded-full bg-[#d84444] px-2 py-1 text-[10px] font-black uppercase tracking-[.14em] text-white">Vetoed</span>}
                          </div>
                          <div className="mt-1 text-sm font-bold opacity-55">Rules: {variant.label}</div>
                          {preset.ruleVariants.length > 1 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {preset.ruleVariants.map((candidate) => (
                                <button
                                  key={candidate.id}
                                  disabled={busy !== null || candidate.id === item.ruleVariantId}
                                  onClick={() => command(
                                    isHost
                                      ? { type: "change-rules", presetId: preset.id, ruleVariantId: candidate.id }
                                      : { type: "suggest-rules", presetId: preset.id, ruleVariantId: candidate.id },
                                    `rules-${preset.id}-${candidate.id}`,
                                  )}
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${candidate.id === item.ruleVariantId ? "border-[#11131a] bg-[#11131a] text-white" : "border-black/20 bg-white"}`}
                                >{candidate.label}{!isHost && candidate.id !== item.ruleVariantId ? " · suggest" : ""}</button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          {isHost && <SmallButton onClick={() => command({ type: "remove", presetId: preset.id }, `remove-${preset.id}`)}>Remove</SmallButton>}
                          {isGuest && <SmallButton onClick={() => command({ type: "veto", presetId: preset.id, vetoed: !item.guestVetoed }, `veto-${preset.id}`)}>{item.guestVetoed ? "Withdraw veto" : "Veto"}</SmallButton>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {challenge.pool.length < requiredPoolSize && (
              <div className="mt-4 text-xs font-black uppercase tracking-[.12em] text-[#a65f00]">Add {requiredPoolSize - challenge.pool.length} more to guarantee a no-repeat first-to-{challenge.firstTo}.</div>
            )}
          </section>

          <section className="rounded-[28px] border-2 border-[#11131a] bg-[#e6e0ff] p-5 sm:p-7">
            <div className="flex items-end justify-between border-b-2 border-[#11131a] pb-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] opacity-45">Curated suggestions</div>
                <div className="mt-1 text-3xl font-black tracking-[-0.045em]">Good games for a Bro v Bro.</div>
              </div>
              <div className="hidden text-right text-xs font-bold opacity-45 sm:block">Steam matching will<br/>narrow this list later.</div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {suggestions.map((preset) => {
                const game = demoGames.find((candidate) => candidate.id === preset.gameId);
                return (
                  <div key={preset.id} className="flex items-center gap-3 rounded-2xl border-2 border-[#11131a] bg-[#f1ede4] p-4 shadow-[3px_3px_0_#11131a]">
                    {game && <GameBadge game={game} />}
                    <div className="min-w-0 flex-1"><div className="font-black leading-tight">{preset.name}</div><div className="mt-1 text-[10px] font-black uppercase tracking-[.13em] opacity-45">{preset.suitability === "featured" ? "Featured pick" : "Recommended"}</div></div>
                    <button
                      disabled={busy !== null || !challenge.opponentName}
                      onClick={() => command(isHost ? { type: "add", presetId: preset.id, source: "suggestion" } : { type: "suggest-add", presetId: preset.id }, `add-${preset.id}`)}
                      className="rounded-xl bg-[#11131a] px-3 py-2 text-xs font-black text-white disabled:opacity-30"
                    >{isHost ? "+ Add" : "Suggest"}</button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {error && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border-2 border-[#11131a] bg-[#d84444] px-5 py-3 text-sm font-black text-white shadow-[4px_4px_0_#11131a]">{error}</div>}
    </LobbyShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/[.06] p-4"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>;
}

function ReadinessRow({ label, ready, you }: { label: string; ready: boolean; you: boolean }) {
  return <div className="flex items-center justify-between rounded-xl bg-white/[.06] px-4 py-3"><span className="text-sm font-black">{label}{you ? " · You" : ""}</span><span className={`text-xs font-black uppercase tracking-[.14em] ${ready ? "text-[#7ee2a8]" : "text-white/35"}`}>{ready ? "Ready" : "Not ready"}</span></div>;
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-lg border border-black/20 bg-white px-3 py-2 text-xs font-black text-[#11131a]">{children}</button>;
}

function LobbyShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#e9e3d8] px-4 py-6 text-[#11131a] sm:px-8"><div className="mx-auto max-w-7xl"><header className="mb-6 flex justify-between border-b-2 border-[#11131a] pb-4"><Link href="/" className="font-black">BRO / V / BRO</Link><span className="text-xs font-black uppercase tracking-[0.18em] opacity-45">Setup room</span></header>{children}</div></main>;
}
