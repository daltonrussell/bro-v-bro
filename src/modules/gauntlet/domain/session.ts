import type { ChallengeSelectionSnapshot, GauntletSession, PlayerId, RoundResult } from "./types.ts";

export class GauntletRuleError extends Error {}

export const otherPlayer = (playerId: PlayerId): PlayerId =>
  playerId === "player-a" ? "player-b" : "player-a";

export function createSession(input: {
  id: string;
  firstTo: number;
  eligibleGameIds: readonly string[];
  challengeSelections?: readonly ChallengeSelectionSnapshot[];
  playerAName: string;
  playerBName: string;
}): GauntletSession {
  if (input.firstTo < 1) throw new GauntletRuleError("firstTo must be at least 1");
  if (input.eligibleGameIds.length === 0) throw new GauntletRuleError("At least one eligible game is required");

  return {
    id: input.id,
    players: [
      { id: "player-a", displayName: input.playerAName, initials: initials(input.playerAName) },
      { id: "player-b", displayName: input.playerBName, initials: initials(input.playerBName) },
    ],
    format: { firstTo: input.firstTo },
    eligibleGameIds: [...new Set(input.eligibleGameIds)],
    challengeSelections: input.challengeSelections ? [...input.challengeSelections] : undefined,
    usedGameIds: [],
    status: "awaiting-coin-flip",
    selectorId: null,
    currentGameId: null,
    pendingResult: null,
    rounds: [],
    score: { "player-a": 0, "player-b": 0 },
    winnerId: null,
    version: 1,
  };
}

export function applyCoinFlip(session: GauntletSession, winnerId: PlayerId): GauntletSession {
  assertStatus(session, "awaiting-coin-flip");
  return bump(session, { status: "selecting-game", selectorId: winnerId });
}

export function selectGame(session: GauntletSession, actorId: PlayerId, gameId: string): GauntletSession {
  assertStatus(session, "selecting-game");
  if (session.selectorId !== actorId) throw new GauntletRuleError("Only the current selector can choose a game");
  if (!session.eligibleGameIds.includes(gameId)) throw new GauntletRuleError("Game is not in the eligible pool");
  if (session.usedGameIds.includes(gameId)) throw new GauntletRuleError("Game has already been played");

  return bump(session, { status: "round-ready", currentGameId: gameId });
}

export function startRound(session: GauntletSession): GauntletSession {
  assertStatus(session, "round-ready");
  if (!session.currentGameId) throw new GauntletRuleError("No game selected");
  return bump(session, { status: "awaiting-result" });
}

export function reportWinner(session: GauntletSession, actorId: PlayerId, winnerId: PlayerId): GauntletSession {
  assertStatus(session, "awaiting-result");
  if (!session.currentGameId) throw new GauntletRuleError("Round is missing a selected game");

  return bump(session, {
    status: "awaiting-result-confirmation",
    pendingResult: { gameId: session.currentGameId, reportedBy: actorId, winnerId },
  });
}

export function confirmReportedWinner(session: GauntletSession, actorId: PlayerId): GauntletSession {
  assertStatus(session, "awaiting-result-confirmation");
  if (!session.pendingResult || !session.currentGameId || !session.selectorId) {
    throw new GauntletRuleError("No pending round result to confirm");
  }
  if (session.pendingResult.reportedBy === actorId) {
    throw new GauntletRuleError("The reporting player cannot confirm their own result");
  }

  const winnerId = session.pendingResult.winnerId;
  const round: RoundResult = {
    roundNumber: session.rounds.length + 1,
    gameId: session.currentGameId,
    selectedBy: session.selectorId,
    winnerId,
    confirmedBy: actorId,
  };
  const score = { ...session.score, [winnerId]: session.score[winnerId] + 1 };
  const completed = score[winnerId] >= session.format.firstTo;

  return bump(session, {
    rounds: [...session.rounds, round],
    usedGameIds: [...session.usedGameIds, session.currentGameId],
    score,
    winnerId: completed ? winnerId : null,
    status: completed ? "completed" : "selecting-game",
    selectorId: completed ? null : otherPlayer(winnerId),
    currentGameId: null,
    pendingResult: null,
  });
}

export function disputeReportedWinner(session: GauntletSession, actorId: PlayerId): GauntletSession {
  assertStatus(session, "awaiting-result-confirmation");
  if (!session.pendingResult) throw new GauntletRuleError("No pending round result to dispute");
  if (session.pendingResult.reportedBy === actorId) {
    throw new GauntletRuleError("The reporting player cannot dispute their own result");
  }
  return bump(session, { status: "awaiting-result", pendingResult: null });
}

/** Convenience helper for the single-browser visual demo only. */
export function confirmWinner(session: GauntletSession, winnerId: PlayerId): GauntletSession {
  const reported = reportWinner(session, winnerId, winnerId);
  return confirmReportedWinner(reported, otherPlayer(winnerId));
}

export function remainingGames(session: GauntletSession): string[] {
  return session.eligibleGameIds.filter((id) => !session.usedGameIds.includes(id));
}

export function chooseRandomGame(session: GauntletSession, random: () => number = Math.random): string {
  assertStatus(session, "selecting-game");
  const options = remainingGames(session);
  if (options.length === 0) throw new GauntletRuleError("No unused games remain");
  const index = Math.min(options.length - 1, Math.floor(random() * options.length));
  return options[index]!;
}

function assertStatus(session: GauntletSession, status: GauntletSession["status"]) {
  if (session.status !== status) throw new GauntletRuleError(`Expected session status ${status}; got ${session.status}`);
}

function bump<T extends Partial<GauntletSession>>(session: GauntletSession, patch: T): GauntletSession {
  return { ...session, ...patch, version: session.version + 1 };
}

function initials(value: string): string {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}
