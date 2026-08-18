import { demoGames } from "@/modules/catalog/domain/game";

export type ImportedGame = {
  provider: "steam";
  providerGameId: string;
  name?: string;
  playtimeMinutes?: number;
};

export type SteamLibraryStatus = "available" | "private-or-unavailable";

export type SteamProfile = {
  steamId: string;
  personaName: string;
  avatarUrl?: string;
  profileUrl?: string;
};

export type SteamLibraryImport = {
  status: SteamLibraryStatus;
  games: readonly ImportedGame[];
};

export interface SteamLibraryProvider {
  readonly configured: boolean;
  getProfile(steamId: string): Promise<SteamProfile>;
  importOwnedGames(steamId: string): Promise<SteamLibraryImport>;
}

export class SteamWebApiLibraryProvider implements SteamLibraryProvider {
  readonly configured: boolean;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(apiKey: string, fetchImpl: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
    this.configured = Boolean(apiKey.trim());
  }

  async getProfile(steamId: string): Promise<SteamProfile> {
    this.assertConfigured();
    const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
    url.searchParams.set("steamids", steamId);
    const response = await this.fetchImpl(url, { headers: { "x-webapi-key": this.apiKey } });
    if (!response.ok) throw new Error(`Steam profile request failed (${response.status})`);
    const body = await response.json() as {
      response?: { players?: Array<{ steamid?: string; personaname?: string; avatarfull?: string; profileurl?: string }> };
    };
    const player = body.response?.players?.[0];
    if (!player?.steamid) throw new Error("Steam profile was not returned");
    return {
      steamId: player.steamid,
      personaName: player.personaname ?? "Steam Player",
      avatarUrl: player.avatarfull,
      profileUrl: player.profileurl,
    };
  }

  async importOwnedGames(steamId: string): Promise<SteamLibraryImport> {
    this.assertConfigured();
    const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/");
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("include_appinfo", "true");
    url.searchParams.set("include_played_free_games", "true");
    const response = await this.fetchImpl(url, { headers: { "x-webapi-key": this.apiKey } });
    if (!response.ok) throw new Error(`Steam library request failed (${response.status})`);
    const body = await response.json() as {
      response?: {
        game_count?: number;
        games?: Array<{ appid: number; name?: string; playtime_forever?: number }>;
      };
    };
    const payload = body.response ?? {};
    if (!Array.isArray(payload.games)) {
      return { status: "private-or-unavailable", games: [] };
    }
    return {
      status: "available",
      games: payload.games.map((game) => ({
        provider: "steam" as const,
        providerGameId: String(game.appid),
        name: game.name,
        playtimeMinutes: game.playtime_forever,
      })),
    };
  }

  private assertConfigured() {
    if (!this.configured) throw new Error("STEAM_WEB_API_KEY is not configured");
  }
}

export class NotConfiguredSteamLibraryProvider implements SteamLibraryProvider {
  readonly configured = false;
  async getProfile(steamId: string): Promise<SteamProfile> {
    return { steamId, personaName: "Steam Player" };
  }
  async importOwnedGames(): Promise<SteamLibraryImport> {
    return { status: "private-or-unavailable", games: [] };
  }
}

export function canonicalGameIdsFromSteamLibrary(games: readonly ImportedGame[]): readonly string[] {
  const appIds = new Set(games.map((game) => game.providerGameId));
  return demoGames
    .filter((game) => game.source === "steam" && game.externalId && appIds.has(game.externalId))
    .map((game) => game.id);
}
