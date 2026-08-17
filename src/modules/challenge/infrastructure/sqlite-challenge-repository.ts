import type { DatabaseSync } from "node:sqlite";
import type { Challenge } from "../domain/types";
import { hashToken } from "./token";
import type { PlayerId } from "@/modules/gauntlet/domain/types";

export class SqliteChallengeRepository {
  constructor(private readonly db: DatabaseSync) {}

  create(input: Challenge & { hostToken: string; inviteToken: string }): void {
    this.db.exec("begin immediate");
    try {
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
        "[]",
        input.createdAt,
      );
      this.db.prepare(`
        insert into prototype_challenge_setup (challenge_id, version, payload)
        values (?, ?, ?)
      `).run(input.id, input.version, JSON.stringify(setupPayload(input)));
      this.db.exec("commit");
    } catch (error) {
      this.db.exec("rollback");
      throw error;
    }
  }

  get(id: string): Challenge | null {
    const row = this.db.prepare(`
      select c.*, s.version as setup_version, s.payload as setup_payload
      from prototype_challenges c
      left join prototype_challenge_setup s on s.challenge_id = c.id
      where c.id = ?
    `).get(id) as Record<string, unknown> | undefined;
    if (!row) return null;

    const fallback = {
      pool: [],
      proposals: [],
      hostReady: false,
      guestReady: false,
      status: row.session_id ? "started" : row.opponent_name ? "configuring" : "waiting-for-opponent",
    } as const;
    const setup = row.setup_payload
      ? JSON.parse(String(row.setup_payload)) as Partial<ReturnType<typeof setupPayload>>
      : fallback;

    return {
      id: String(row.id),
      hostName: String(row.host_name),
      opponentName: row.opponent_name ? String(row.opponent_name) : null,
      firstTo: Number(row.first_to),
      pool: setup.pool ?? [],
      proposals: setup.proposals ?? [],
      hostReady: setup.hostReady ?? false,
      guestReady: setup.guestReady ?? false,
      version: Number(row.setup_version ?? 1),
      status: setup.status ?? fallback.status,
      sessionId: row.session_id ? String(row.session_id) : null,
      createdAt: String(row.created_at),
    };
  }

  saveSetup(challenge: Challenge, expectedVersion: number): void {
    const result = this.db.prepare(`
      update prototype_challenge_setup
      set version = ?, payload = ?, updated_at = current_timestamp
      where challenge_id = ? and version = ?
    `).run(challenge.version, JSON.stringify(setupPayload(challenge)), challenge.id, expectedVersion);
    if (result.changes !== 1) throw new Error("Challenge changed in another browser; refresh and try again");
  }

  verifyHost(id: string, token: string): boolean {
    return Boolean(this.db.prepare("select 1 as ok from prototype_challenges where id = ? and host_token_hash = ?")
      .get(id, hashToken(token)));
  }

  verifyInvite(id: string, token: string): boolean {
    return Boolean(this.db.prepare("select 1 as ok from prototype_challenges where id = ? and invite_token_hash = ?")
      .get(id, hashToken(token)));
  }

  verifyOpponent(id: string, token: string): boolean {
    return Boolean(this.db.prepare("select 1 as ok from prototype_challenges where id = ? and opponent_token_hash = ?")
      .get(id, hashToken(token)));
  }

  join(id: string, opponentName: string, opponentToken: string): void {
    const result = this.db.prepare(`
      update prototype_challenges
      set opponent_name = ?, opponent_token_hash = ?
      where id = ? and opponent_name is null and session_id is null
    `).run(opponentName, hashToken(opponentToken), id);
    if (result.changes !== 1) throw new Error("Challenge has already been joined");
  }

  attachSession(challengeId: string, sessionId: string): void {
    const result = this.db.prepare(`
      update prototype_challenges set session_id = ? where id = ? and session_id is null
    `).run(sessionId, challengeId);
    if (result.changes !== 1) throw new Error("Challenge has already started");
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

function setupPayload(challenge: Challenge) {
  return {
    pool: challenge.pool,
    proposals: challenge.proposals,
    hostReady: challenge.hostReady,
    guestReady: challenge.guestReady,
    status: challenge.status,
  };
}
