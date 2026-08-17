export type ImportedGame = {
  provider: "steam";
  providerGameId: string;
  name?: string;
  playtimeMinutes?: number;
};

export interface SteamLibraryProvider {
  importOwnedGames(steamId: string): Promise<readonly ImportedGame[]>;
}

/**
 * Deliberately not implemented yet. Steam privacy/API failures are expected outcomes
 * and must fall back to manual game-pool editing in the UI.
 */
export class NotConfiguredSteamLibraryProvider implements SteamLibraryProvider {
  async importOwnedGames(): Promise<readonly ImportedGame[]> {
    return [];
  }
}
