import type { DatabaseSync } from "node:sqlite";
import type { GauntletSessionRepository } from "../application/session-repository";
import { OptimisticConcurrencyError } from "../application/session-repository";
import type { GauntletSession } from "../domain/types";

export class SqliteSessionRepository implements GauntletSessionRepository {
  constructor(private readonly db: DatabaseSync) {}

  async getById(id: string): Promise<GauntletSession | null> {
    const row = this.db.prepare("select payload from prototype_sessions where id = ?").get(id) as { payload?: string } | undefined;
    return row?.payload ? (JSON.parse(row.payload) as GauntletSession) : null;
  }

  async create(session: GauntletSession): Promise<void> {
    this.db.prepare("insert into prototype_sessions (id, version, payload) values (?, ?, ?)")
      .run(session.id, session.version, JSON.stringify(session));
  }

  async hasProcessedCommand(sessionId: string, idempotencyKey: string): Promise<boolean> {
    return Boolean(this.db.prepare(
      "select 1 as found from prototype_commands where session_id = ? and idempotency_key = ?",
    ).get(sessionId, idempotencyKey));
  }

  async save(session: GauntletSession, options: { expectedVersion: number; idempotencyKey: string }): Promise<"saved" | "duplicate"> {
    this.db.exec("begin immediate");
    try {
      const duplicate = this.db.prepare(
        "select 1 as found from prototype_commands where session_id = ? and idempotency_key = ?",
      ).get(session.id, options.idempotencyKey) as { found?: number } | undefined;
      if (duplicate?.found) {
        this.db.exec("rollback");
        return "duplicate";
      }

      const result = this.db.prepare(
        "update prototype_sessions set version = ?, payload = ?, updated_at = current_timestamp where id = ? and version = ?",
      ).run(session.version, JSON.stringify(session), session.id, options.expectedVersion);
      if (result.changes !== 1) throw new OptimisticConcurrencyError("Session was modified by another request");

      this.db.prepare("insert into prototype_commands (session_id, idempotency_key) values (?, ?)")
        .run(session.id, options.idempotencyKey);
      this.db.exec("commit");
      return "saved";
    } catch (error) {
      try { this.db.exec("rollback"); } catch {}
      throw error;
    }
  }
}
