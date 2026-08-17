import type { ChallengePreset } from "./challenge-preset.ts";
import { getRuleVariant } from "./challenge-preset.ts";
import type { BroVBroTemplate } from "./template.ts";

export type MatchPoolSource = "template" | "suggestion" | "search" | "pinned";

export type MatchPoolItem = {
  presetId: string;
  ruleVariantId: string;
  source: MatchPoolSource;
};

export function createMatchPoolFromTemplate(
  template: BroVBroTemplate,
  presets: readonly ChallengePreset[],
): readonly MatchPoolItem[] {
  const byId = new Map(presets.map((preset) => [preset.id, preset]));

  return template.challengePresetIds.map((presetId) => {
    const preset = byId.get(presetId);
    if (!preset) throw new Error(`Template ${template.id} references unknown preset ${presetId}`);
    return {
      presetId,
      ruleVariantId: preset.defaultRuleVariantId,
      source: "template" as const,
    };
  });
}

export function addChallengeToPool(
  pool: readonly MatchPoolItem[],
  preset: ChallengePreset,
  source: MatchPoolSource = "suggestion",
): readonly MatchPoolItem[] {
  if (pool.some((item) => item.presetId === preset.id)) return pool;

  return [
    ...pool,
    {
      presetId: preset.id,
      ruleVariantId: preset.defaultRuleVariantId,
      source,
    },
  ];
}

export function removeChallengeFromPool(
  pool: readonly MatchPoolItem[],
  presetId: string,
): readonly MatchPoolItem[] {
  return pool.filter((item) => item.presetId !== presetId);
}

export function changeChallengeRuleset(
  pool: readonly MatchPoolItem[],
  preset: ChallengePreset,
  ruleVariantId: string,
): readonly MatchPoolItem[] {
  getRuleVariant(preset, ruleVariantId);

  if (!pool.some((item) => item.presetId === preset.id)) {
    throw new Error(`Challenge ${preset.id} is not in the match pool`);
  }

  return pool.map((item) =>
    item.presetId === preset.id ? { ...item, ruleVariantId } : item,
  );
}
