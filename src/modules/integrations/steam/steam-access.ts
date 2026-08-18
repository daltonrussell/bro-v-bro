import { canonicalGameIdsFromSteamLibrary } from "./steam-library-provider.ts";
import type { SteamChallengeConnection, SteamChallengeRole } from "./sqlite-steam-connection-repository.ts";

export type SteamParticipantAccess = {
  role: SteamChallengeRole;
  connected: true;
  steamId: string;
  personaName: string;
  avatarUrl?: string;
  profileUrl?: string;
  libraryStatus: SteamChallengeConnection["libraryStatus"];
  ownedGameCount: number;
  canonicalGameIds: readonly string[];
  syncedAt: string;
};

export type SteamChallengeAccess = {
  host: SteamParticipantAccess | null;
  guest: SteamParticipantAccess | null;
  mutualCanonicalGameIds: readonly string[];
};

export function summarizeSteamChallengeAccess(
  connections: readonly SteamChallengeConnection[],
): SteamChallengeAccess {
  const host = summarize(connections.find((connection) => connection.role === "host"));
  const guest = summarize(connections.find((connection) => connection.role === "guest"));

  if (!host || !guest || host.libraryStatus !== "available" || guest.libraryStatus !== "available") {
    return { host, guest, mutualCanonicalGameIds: [] };
  }

  const guestGames = new Set(guest.canonicalGameIds);
  return {
    host,
    guest,
    mutualCanonicalGameIds: host.canonicalGameIds.filter((gameId) => guestGames.has(gameId)),
  };
}

function summarize(connection: SteamChallengeConnection | undefined): SteamParticipantAccess | null {
  if (!connection) return null;
  return {
    role: connection.role,
    connected: true,
    steamId: connection.profile.steamId,
    personaName: connection.profile.personaName,
    avatarUrl: connection.profile.avatarUrl,
    profileUrl: connection.profile.profileUrl,
    libraryStatus: connection.libraryStatus,
    ownedGameCount: connection.games.length,
    canonicalGameIds: canonicalGameIdsFromSteamLibrary(connection.games),
    syncedAt: connection.syncedAt,
  };
}
