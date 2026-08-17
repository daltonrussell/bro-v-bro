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

export type RuleVariant = {
  id: string;
  label: string;
  description?: string;
  setupNotes?: string;
};

/**
 * A ChallengePreset is the curated competitive mode Bro v Bro can suggest.
 * Sometimes that maps 1:1 to a game (Nidhogg); sometimes it is a focused mode
 * inside a larger game (Dota 2 -> 1v1 Mid).
 *
 * Presets may expose a small curated set of editable rule variants. This gives
 * players useful flexibility without turning setup into a free-form rules engine.
 */
export type ChallengePreset = {
  id: string;
  gameId: string;
  name: string;
  shortLabel: string;
  description: string;
  suitability: Exclude<BroVBroSuitability, "not-suitable">;
  tags: readonly ChallengeTag[];
  ruleVariants: readonly RuleVariant[];
  defaultRuleVariantId: string;
  setupNotes?: string;
  defaultForGame?: boolean;
};

const standardRule = (): readonly RuleVariant[] => [{ id: "standard", label: "Standard" }];

export const demoChallengePresets: readonly ChallengePreset[] = [
  {
    id: "dota-2-1v1-mid",
    gameId: "dota-2",
    name: "Dota 2 — 1v1 Mid",
    shortLabel: "1v1 Mid",
    description: "Classic mid-lane duel. Add it directly instead of treating all of Dota 2 as a generic round.",
    suitability: "featured",
    tags: ["classic-1v1", "strategy", "mechanical", "creator-popular"],
    ruleVariants: standardRule(),
    defaultRuleVariantId: "standard",
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
    ruleVariants: standardRule(),
    defaultRuleVariantId: "standard",
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
    ruleVariants: standardRule(),
    defaultRuleVariantId: "standard",
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
    ruleVariants: standardRule(),
    defaultRuleVariantId: "standard",
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
    ruleVariants: standardRule(),
    defaultRuleVariantId: "standard",
    defaultForGame: true,
  },
  {
    id: "geoguessr-duel",
    gameId: "geoguessr",
    name: "GeoGuessr",
    shortLabel: "GeoGuessr",
    description: "Head-to-head geography challenge with a small set of common Bro v Bro rulesets.",
    suitability: "featured",
    tags: ["geography", "knowledge", "creator-popular"],
    ruleVariants: [
      {
        id: "no-move",
        label: "No Move",
        description: "Players may pan and zoom but cannot move from the starting location.",
      },
      {
        id: "no-move-no-zoom",
        label: "No Move + No Zoom",
        description: "Players stay at the starting location and cannot zoom.",
      },
      {
        id: "no-rules",
        label: "No Rules",
        description: "Moving, panning, and zooming are all allowed.",
      },
    ],
    defaultRuleVariantId: "no-move",
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
    ruleVariants: standardRule(),
    defaultRuleVariantId: "standard",
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
    ruleVariants: standardRule(),
    defaultRuleVariantId: "standard",
    defaultForGame: true,
  },
] as const;

export function getChallengePresetsForGame(gameId: string): readonly ChallengePreset[] {
  return demoChallengePresets.filter((preset) => preset.gameId === gameId);
}

export function getRuleVariant(preset: ChallengePreset, ruleVariantId: string): RuleVariant {
  const variant = preset.ruleVariants.find((candidate) => candidate.id === ruleVariantId);
  if (!variant) throw new Error(`Unknown rule variant ${ruleVariantId} for ${preset.id}`);
  return variant;
}

export function formatChallengeSelection(preset: ChallengePreset, ruleVariantId: string): string {
  const variant = getRuleVariant(preset, ruleVariantId);
  if (preset.ruleVariants.length === 1 && variant.id === "standard") return preset.name;
  return `${preset.name} — ${variant.label}`;
}
