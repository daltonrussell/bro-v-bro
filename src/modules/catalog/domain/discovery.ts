import type { ChallengePreset } from "./challenge-preset.ts";

export type ChallengeSuggestion = {
  preset: ChallengePreset;
  score: number;
  reasons: readonly string[];
};

const suitabilityScore = {
  featured: 100,
  recommended: 70,
  niche: 30,
  "manual-only": 0,
} as const;

/**
 * Rank Bro-v-Bro-worthy challenges from games both players can access.
 * Existing pool entries are excluded so the result can be rendered directly
 * as an Add-oriented suggestion rail beneath the editable match pool.
 *
 * Library intersection is an eligibility signal, never recommendation evidence.
 */
export function rankChallengeSuggestions(
  presets: readonly ChallengePreset[],
  eligibleGameIds: ReadonlySet<string>,
  pinnedPresetIds: ReadonlySet<string> = new Set(),
  selectedPresetIds: ReadonlySet<string> = new Set(),
): readonly ChallengeSuggestion[] {
  return presets
    .filter((preset) => eligibleGameIds.has(preset.gameId))
    .filter((preset) => !selectedPresetIds.has(preset.id))
    .filter((preset) => preset.suitability !== "manual-only" || pinnedPresetIds.has(preset.id))
    .map((preset) => {
      const reasons: string[] = [];
      let score = suitabilityScore[preset.suitability];

      if (preset.suitability === "featured") reasons.push("Featured Bro v Bro pick");
      if (preset.suitability === "recommended") reasons.push("Good head-to-head fit");
      if (preset.tags.includes("creator-popular")) {
        score += 15;
        reasons.push("Common creator-style competition");
      }
      if (pinnedPresetIds.has(preset.id)) {
        score += 10_000;
        reasons.unshift("Pinned for this Bro v Bro");
      }

      reasons.push("Both players can access it");
      return { preset, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.preset.name.localeCompare(b.preset.name));
}
