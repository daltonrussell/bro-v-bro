export type GameSource = "steam" | "browser" | "manual";

export type Game = {
  id: string;
  name: string;
  shortName: string;
  source: GameSource;
  externalId?: string;
  launchUrl?: string;
  accent: string;
};

/**
 * Curated prototype catalog. This is intentionally provider-agnostic: a Game is
 * the thing people compete in; Steam/Epic/browser mappings become adapters later.
 */
export const demoGames: readonly Game[] = [
  { id: "cs2", name: "Counter-Strike 2", shortName: "CS2", source: "steam", externalId: "730", accent: "#f0a23b" },
  { id: "rocket-league", name: "Rocket League", shortName: "RL", source: "manual", accent: "#3d8eff" },
  { id: "geoguessr", name: "GeoGuessr", shortName: "GEO", source: "browser", launchUrl: "https://www.geoguessr.com/", accent: "#ef4b4b" },
  { id: "chess", name: "Chess", shortName: "CH", source: "browser", accent: "#c4a06a" },
  { id: "valorant", name: "Valorant", shortName: "VAL", source: "manual", accent: "#ff4655" },
  { id: "wikipedia-race", name: "Wikipedia Race", shortName: "WIKI", source: "browser", launchUrl: "https://www.wikipedia.org/", accent: "#d9d9d9" },
  { id: "brawlhalla", name: "Brawlhalla", shortName: "BH", source: "steam", accent: "#816bff" },
  { id: "fortnite", name: "Fortnite", shortName: "FN", source: "manual", accent: "#71d8ff" },
  { id: "tic-tac-toe", name: "Tic-Tac-Toe", shortName: "TTT", source: "manual", accent: "#7ee2a8" },
  { id: "fleet-duel", name: "Fleet Duel", shortName: "FLT", source: "manual", accent: "#4dc6d8" },
  { id: "typing-race", name: "Typing Race", shortName: "TYPE", source: "manual", accent: "#f2b84b" },
  { id: "reaction-duel", name: "Reaction Duel", shortName: "RXN", source: "manual", accent: "#ff7b9c" },
] as const;
