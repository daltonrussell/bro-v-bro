export type GameSource = "steam" | "browser" | "manual";

export type BroVBroSuitability =
  | "featured"
  | "recommended"
  | "niche"
  | "manual-only"
  | "not-suitable";

export type Game = {
  id: string;
  name: string;
  shortName: string;
  source: GameSource;
  externalId?: string;
  launchUrl?: string;
  accent: string;
  /**
   * Library ownership answers "can these players launch this?". Suitability answers
   * the separate question "should Bro v Bro proactively suggest this?".
   */
  broVBroSuitability?: BroVBroSuitability;
};

export function isSuggestedGame(game: Game): boolean {
  return game.broVBroSuitability === "featured" || game.broVBroSuitability === "recommended";
}

/**
 * Curated prototype catalog. This is intentionally provider-agnostic: a Game is
 * the title/activity itself. The actual Bro v Bro competition lives one level
 * below this as a ChallengePreset (for example Dota 2 -> 1v1 Mid).
 *
 * Steam/Epic/browser ownership mappings are evidence for discoverability; they
 * do not automatically make every owned game a suggested Bro v Bro game.
 */
export const demoGames: readonly Game[] = [
  { id: "cs2", name: "Counter-Strike 2", shortName: "CS2", source: "steam", externalId: "730", accent: "#f0a23b", broVBroSuitability: "featured" },
  { id: "dota-2", name: "Dota 2", shortName: "DOTA", source: "steam", externalId: "570", accent: "#b33b2e", broVBroSuitability: "featured" },
  { id: "rocket-league", name: "Rocket League", shortName: "RL", source: "manual", accent: "#3d8eff", broVBroSuitability: "featured" },
  { id: "ultimate-chicken-horse", name: "Ultimate Chicken Horse", shortName: "UCH", source: "steam", accent: "#f1bf43", broVBroSuitability: "featured" },
  { id: "nidhogg", name: "Nidhogg", shortName: "NID", source: "steam", accent: "#ef5ea8", broVBroSuitability: "featured" },
  { id: "geoguessr", name: "GeoGuessr", shortName: "GEO", source: "browser", launchUrl: "https://www.geoguessr.com/", accent: "#ef4b4b", broVBroSuitability: "featured" },
  { id: "chess", name: "Chess", shortName: "CH", source: "browser", accent: "#c4a06a", broVBroSuitability: "recommended" },
  { id: "valorant", name: "Valorant", shortName: "VAL", source: "manual", accent: "#ff4655", broVBroSuitability: "recommended" },
  { id: "wikipedia-race", name: "Wikipedia Race", shortName: "WIKI", source: "browser", launchUrl: "https://www.wikipedia.org/", accent: "#d9d9d9", broVBroSuitability: "featured" },
  { id: "brawlhalla", name: "Brawlhalla", shortName: "BH", source: "steam", accent: "#816bff", broVBroSuitability: "recommended" },
  { id: "fortnite", name: "Fortnite", shortName: "FN", source: "manual", accent: "#71d8ff", broVBroSuitability: "recommended" },
  { id: "tic-tac-toe", name: "Tic-Tac-Toe", shortName: "TTT", source: "manual", accent: "#7ee2a8", broVBroSuitability: "featured" },
  { id: "fleet-duel", name: "Fleet Duel", shortName: "FLT", source: "manual", accent: "#4dc6d8", broVBroSuitability: "featured" },
  { id: "typing-race", name: "Typing Race", shortName: "TYPE", source: "manual", accent: "#f2b84b", broVBroSuitability: "recommended" },
  { id: "reaction-duel", name: "Reaction Duel", shortName: "RXN", source: "manual", accent: "#ff7b9c", broVBroSuitability: "recommended" },
] as const;
