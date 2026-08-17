import type { PlayerId } from "../domain/types.ts";

export type SessionCommand =
  | { type: "FLIP_FOR_FIRST_PICK" }
  | { type: "SELECT_GAME"; gameId: string }
  | { type: "SELECT_RANDOM_GAME" }
  | { type: "START_ROUND" }
  | { type: "REPORT_RESULT"; winnerId: PlayerId }
  | { type: "CONFIRM_RESULT" }
  | { type: "DISPUTE_RESULT" };

export type CommandEnvelope = {
  sessionId: string;
  actorId: PlayerId;
  expectedVersion: number;
  idempotencyKey: string;
  command: SessionCommand;
};
