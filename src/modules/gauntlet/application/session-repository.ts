import type { GauntletSession } from "../domain/types.ts";

export class OptimisticConcurrencyError extends Error {}

export interface GauntletSessionRepository {
  getById(id: string): Promise<GauntletSession | null>;
  create(session: GauntletSession): Promise<void>;
  hasProcessedCommand(sessionId: string, idempotencyKey: string): Promise<boolean>;
  save(
    session: GauntletSession,
    options: { expectedVersion: number; idempotencyKey: string },
  ): Promise<"saved" | "duplicate">;
}
