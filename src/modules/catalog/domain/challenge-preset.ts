import type { BroVBroSuitability } from "./game.ts";

export type ChallengeTag =
  | "classic-1v1"
  | "party"
  | "mechanical"
  | "strategy"
  | "fps"
  | "sports"
  | "fighting"
  | "knowledge"
  | "geography"
  | "luck-neutral"
  | "creator-popular";

/**
 * A ChallengePreset is the atomic thing a Bro v Bro actually competes in.
 * Sometimes that maps 1:1 to a game (Nidhogg); sometimes it is a curated
 * format inside a larger game (Dota 2 -> 1v1 Mid).
 *
 * Presets are intentionally curated rather than user-configurable rulesets.
 */
export type ChallengePreset = {
  id: string;
  gameId: string;
  name: string;
  shortLabel: string;
  description: string;
  suitability: Exclude<BroVBroSuitability, "not-suitable">;
  tags: readonly ChallengeTag[];
  setupNotes?: string;
  defaultForGame?: boolean;
};

export const demoChallengePresets: readonly ChallengePreset[] = [
  {
    id: "dota-2-1v1-mid",
    gameId: "dota-2",
    name: "Dota 2 — 1v1 Mid",
    shortLabel: "1v1 Mid",
    description: "Classic mid-lane duel. Add it directly instead of treating all of Dota 2 as a generic round.",
    suitability: "featured",
    tags: ["classic-1v1", "strategy", "mechanical", "creator-popular"],
    setupNotes: "Create a private lobby and use the agreed 1v1 mid setup.",
    defaultForGame: true,
  },
  {
    id: "cs2-1v1",
    gameId: "cs2",
    name: "Counter-Strike 2 — 1v1",
    shortLabel: "1v1",
    description: "A direct CS2 duel on a mutually agreed 1v1/aim setup.",
    suitability: "featured",
    tags: ["classic-1v1", "fps", "mechanical", "creator-popular"],
    defaultForGame: true,
  },
  {
    id: "rocket-league-1v1",
    gameId: "rocket-league",
    name: "Rocket League — 1v1",
    shortLabel: "1v1",
    description: "Standard head-to-head Rocket League duel.",
    suitability: "featured",
    tags: ["classic-1v1", "sports", "mechanical", "creator-popular"],
    defaultForGame: true,
  },
  {
    id: "nidhogg-standard",
    gameId: "nidhogg",
    name: "Nidhogg",
    shortLabel: "Standard",
    description: "The base game is already an excellent compact head-to-head competition.",
    suitability: "featured",
    tags: ["classic-1v1", "fighting", "mechanical", "creator-popular"],
    defaultForGame: true,
  },
  {
    id: "ultimate-chicken-horse-race",
    gameId: "ultimate-chicken-horse",
    name: "Ultimate Chicken Horse — Versus",
    shortLabel: "Versus",
    description: "Competitive obstacle-building rounds; particularly good as a change-of-pace Bro v Bro pick.",
    suitability: "featured",
    tags: ["party", "mechanical", "creator-popular"],
    defaultForGame: true,
  },
  {
    id: "geoguessr-no-move",
    gameId: "geoguessr",
    name: "GeoGuessr — No Move",
    shortLabel: "No Move",
    description: "Geography duel where neither player moves from the starting location.",
    suitability: "featured",
    tags: ["geography", "knowledge", "creator-popular"],
    defaultForGame: true,
  },
  {
    id: "wikipedia-race-standard",
    gameId: "wikipedia-race",
    name: "Wikipedia Race",
    shortLabel: "Race",
    description: "Start from the same page and race through links to the same target page.",
    suitability: "featured",
    tags: ["knowledge", "luck-neutral", "creator-popular"],
    defaultForGame: true,
  },
  {
    id: "chess-standard",
    gameId: "chess",
    name: "Chess",
    shortLabel: "Standard",
    description: "Straightforward head-to-head chess game.",
    suitability: "recommended",
    tags: ["classic-1v1", "strategy"],
    defaultForGame: true,
  },
] as const;

export function getChallengePresetsForGame(gameId: string): readonly ChallengePreset[] {
  return demoChallengePresets.filter((preset) => preset.gameId === gameId);
}
