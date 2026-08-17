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
 * Rank only Bro-v-Bro-worthy challenges from the games both players can access.
 * The library intersection is an eligibility signal, not the recommendation.
 *
 * This intentionally stays deterministic/simple for MVP; template usage and
 * telemetry can become additional weights later without changing the caller.
 */
export function rankChallengeSuggestions(
  presets: readonly ChallengePreset[],
  eligibleGameIds: ReadonlySet<string>,
  pinnedPresetIds: ReadonlySet<string> = new Set(),
): readonly ChallengeSuggestion[] {
  return presets
    .filter((preset) => eligibleGameIds.has(preset.gameId))
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
