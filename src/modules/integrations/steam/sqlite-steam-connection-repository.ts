import type { DatabaseSync } from "node:sqlite";
import type { ImportedGame, SteamLibraryStatus, SteamProfile } from "./steam-library-provider";

export type SteamChallengeRole = "host" | "guest";

export type SteamLinkState = {
  state: string;
  challengeId: string;
  role: SteamChallengeRole;
  participantToken: string;
  expiresAt: number;
};

export type SteamChallengeConnection = {
  challengeId: string;
  role: SteamChallengeRole;
  profile: SteamProfile;
  libraryStatus: SteamLibraryStatus;
  games: readonly ImportedGame[];
  syncedAt: string;
};

export class SqliteSteamConnectionRepository {
  constructor(private readonly db: DatabaseSync) {}

  createLinkState(input: SteamLinkState): void {
    this.db.prepare(`
      insert into prototype_steam_link_states (state, challenge_id, role, participant_token, expires_at)
      values (?, ?, ?, ?, ?)
    `).run(input.state, input.challengeId, input.role, input.participantToken, input.expiresAt);
  }

  getLinkState(state: string): SteamLinkState | null {
    const row = this.db.prepare("select * from prototype_steam_link_states where state = ?").get(state) as Record<string, unknown> | undefined;
    if (!row) return null;
    const value: SteamLinkState = {
      state: String(row.state),
      challengeId: String(row.challenge_id),
      role: String(row.role) as SteamChallengeRole,
      participantToken: String(row.participant_token),
      expiresAt: Number(row.expires_at),
    };
    if (value.expiresAt < Date.now()) {
      this.deleteLinkState(state);
      return null;
    }
    return value;
  }

  deleteLinkState(state: string): void {
    this.db.prepare("delete from prototype_steam_link_states where state = ?").run(state);
  }

  upsertConnection(input: SteamChallengeConnection): void {
    this.db.prepare(`
      insert into prototype_steam_connections
        (challenge_id, role, steam_id, persona_name, avatar_url, profile_url, library_status, games_json, synced_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(challenge_id, role) do update set
        steam_id = excluded.steam_id,
        persona_name = excluded.persona_name,
        avatar_url = excluded.avatar_url,
        profile_url = excluded.profile_url,
        library_status = excluded.library_status,
        games_json = excluded.games_json,
        synced_at = excluded.synced_at
    `).run(
      input.challengeId,
      input.role,
      input.profile.steamId,
      input.profile.personaName,
      input.profile.avatarUrl ?? null,
      input.profile.profileUrl ?? null,
      input.libraryStatus,
      JSON.stringify(input.games),
      input.syncedAt,
    );
  }

  listForChallenge(challengeId: string): readonly SteamChallengeConnection[] {
    const rows = this.db.prepare("select * from prototype_steam_connections where challenge_id = ? order by role").all(challengeId) as Record<string, unknown>[];
    return rows.map((row) => ({
      challengeId: String(row.challenge_id),
      role: String(row.role) as SteamChallengeRole,
      profile: {
        steamId: String(row.steam_id),
        personaName: String(row.persona_name),
        avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
        profileUrl: row.profile_url ? String(row.profile_url) : undefined,
      },
      libraryStatus: String(row.library_status) as SteamLibraryStatus,
      games: JSON.parse(String(row.games_json)) as ImportedGame[],
      syncedAt: String(row.synced_at),
    }));
  }
}
