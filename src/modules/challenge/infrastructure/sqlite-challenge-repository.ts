import type { DatabaseSync } from "node:sqlite";
import type { Challenge } from "../domain/types";
import { hashToken } from "./token";
import type { PlayerId } from "@/modules/gauntlet/domain/types";

export class SqliteChallengeRepository {
  constructor(private readonly db: DatabaseSync) {}

  create(input: Challenge & { hostToken: string; inviteToken: string }): void {
    this.db.prepare(`
      insert into prototype_challenges
        (id, host_name, host_token_hash, invite_token_hash, first_to, game_ids_json, created_at)
      values (?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.id,
      input.hostName,
      hashToken(input.hostToken),
      hashToken(input.inviteToken),
      input.firstTo,
      JSON.stringify(input.gameIds),
      input.createdAt,
    );
  }

  get(id: string): Challenge | null {
    const row = this.db.prepare("select * from prototype_challenges where id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      hostName: String(row.host_name),
      opponentName: row.opponent_name ? String(row.opponent_name) : null,
      firstTo: Number(row.first_to),
      gameIds: JSON.parse(String(row.game_ids_json)) as string[],
      sessionId: row.session_id ? String(row.session_id) : null,
      createdAt: String(row.created_at),
    };
  }

  verifyHost(id: string, token: string): boolean {
    return Boolean(this.db.prepare("select 1 as ok from prototype_challenges where id = ? and host_token_hash = ?")
      .get(id, hashToken(token)));
  }

  verifyInvite(id: string, token: string): boolean {
    return Boolean(this.db.prepare("select 1 as ok from prototype_challenges where id = ? and invite_token_hash = ?")
      .get(id, hashToken(token)));
  }

  join(id: string, opponentName: string, opponentToken: string, sessionId: string): void {
    const result = this.db.prepare(`
      update prototype_challenges
      set opponent_name = ?, opponent_token_hash = ?, session_id = ?
      where id = ? and opponent_name is null and session_id is null
    `).run(opponentName, hashToken(opponentToken), sessionId, id);
    if (result.changes !== 1) throw new Error("Challenge has already been joined");
  }

  bindSessionAccessFromChallenge(challengeId: string, sessionId: string): void {
    const row = this.db.prepare(
      "select host_token_hash, opponent_token_hash from prototype_challenges where id = ?",
    ).get(challengeId) as { host_token_hash?: string; opponent_token_hash?: string } | undefined;
    if (!row?.host_token_hash || !row.opponent_token_hash) throw new Error("Challenge access tokens are incomplete");
    this.db.prepare("insert into prototype_session_access (session_id, player_id, token_hash) values (?, ?, ?)")
      .run(sessionId, "player-a", row.host_token_hash);
    this.db.prepare("insert into prototype_session_access (session_id, player_id, token_hash) values (?, ?, ?)")
      .run(sessionId, "player-b", row.opponent_token_hash);
  }

  resolvePlayer(sessionId: string, token: string): PlayerId | null {
    const row = this.db.prepare("select player_id from prototype_session_access where session_id = ? and token_hash = ?")
      .get(sessionId, hashToken(token)) as { player_id?: PlayerId } | undefined;
    return row?.player_id ?? null;
  }
}
