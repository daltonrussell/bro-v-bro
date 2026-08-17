import assert from "node:assert/strict";
import test from "node:test";
import {
  demoChallengePresets,
  formatChallengeSelection,
} from "../src/modules/catalog/domain/challenge-preset.ts";
import {
  addChallengeToPool,
  changeChallengeRuleset,
  createMatchPoolFromTemplate,
  removeChallengeFromPool,
} from "../src/modules/catalog/domain/match-pool.ts";
import { demoTemplates } from "../src/modules/catalog/domain/template.ts";

const preset = (id: string) => {
  const value = demoChallengePresets.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`Missing test preset ${id}`);
  return value;
};

test("template seeds an editable pool using each challenge default ruleset", () => {
  const pool = createMatchPoolFromTemplate(demoTemplates[0]!, demoChallengePresets);
  const geo = pool.find((item) => item.presetId === "geoguessr-duel");
  assert.equal(geo?.ruleVariantId, "no-move");
});

test("suggested challenge can be added and template challenge can be removed independently", () => {
  let pool = createMatchPoolFromTemplate(demoTemplates[0]!, demoChallengePresets);
  pool = addChallengeToPool(pool, preset("dota-2-1v1-mid"));
  assert.ok(pool.some((item) => item.presetId === "dota-2-1v1-mid"));

  pool = removeChallengeFromPool(pool, "cs2-1v1");
  assert.equal(pool.some((item) => item.presetId === "cs2-1v1"), false);
});

test("GeoGuessr ruleset is editable without replacing the challenge", () => {
  const geoPreset = preset("geoguessr-duel");
  let pool = createMatchPoolFromTemplate(demoTemplates[0]!, demoChallengePresets);
  pool = changeChallengeRuleset(pool, geoPreset, "no-move-no-zoom");

  const geo = pool.find((item) => item.presetId === "geoguessr-duel");
  assert.equal(geo?.ruleVariantId, "no-move-no-zoom");
  assert.equal(formatChallengeSelection(geoPreset, geo!.ruleVariantId), "GeoGuessr — No Move + No Zoom");
});

test("unknown ruleset is rejected", () => {
  const geoPreset = preset("geoguessr-duel");
  const pool = createMatchPoolFromTemplate(demoTemplates[0]!, demoChallengePresets);
  assert.throws(() => changeChallengeRuleset(pool, geoPreset, "flying-mode"), /Unknown rule variant/);
});
