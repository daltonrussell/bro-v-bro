import {
  applyCoinFlip,
  chooseRandomGame,
  confirmReportedWinner,
  disputeReportedWinner,
  reportWinner,
  selectGame,
  startRound,
} from "../domain/session.ts";
import type { GauntletSession, PlayerId } from "../domain/types.ts";
import type { CommandEnvelope } from "./commands.ts";
import type { GauntletSessionRepository } from "./session-repository.ts";

export async function executeSessionCommand(input: {
  repository: GauntletSessionRepository;
  envelope: CommandEnvelope;
  random?: () => number;
}): Promise<GauntletSession> {
  const { repository, envelope } = input;
  const current = await repository.getById(envelope.sessionId);
  if (!current) throw new Error("Session not found");

  if (await repository.hasProcessedCommand(envelope.sessionId, envelope.idempotencyKey)) return current;

  if (current.version !== envelope.expectedVersion) {
    throw new Error(`Stale session version. Expected ${envelope.expectedVersion}; current ${current.version}`);
  }

  const next = applyCommand(current, envelope.actorId, envelope.command, input.random ?? Math.random);
  const result = await repository.save(next, {
    expectedVersion: current.version,
    idempotencyKey: envelope.idempotencyKey,
  });

  if (result === "duplicate") return (await repository.getById(envelope.sessionId)) ?? current;
  return next;
}

function applyCommand(
  session: GauntletSession,
  actorId: PlayerId,
  command: CommandEnvelope["command"],
  random: () => number,
): GauntletSession {
  switch (command.type) {
    case "FLIP_FOR_FIRST_PICK":
      return applyCoinFlip(session, random() < 0.5 ? "player-a" : "player-b");
    case "SELECT_GAME":
      return selectGame(session, actorId, command.gameId);
    case "SELECT_RANDOM_GAME":
      return selectGame(session, actorId, chooseRandomGame(session, random));
    case "START_ROUND":
      return startRound(session);
    case "REPORT_RESULT":
      return reportWinner(session, actorId, command.winnerId);
    case "CONFIRM_RESULT":
      return confirmReportedWinner(session, actorId);
    case "DISPUTE_RESULT":
      return disputeReportedWinner(session, actorId);
  }
}
