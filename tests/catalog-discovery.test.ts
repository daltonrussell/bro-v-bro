import assert from "node:assert/strict";
import test from "node:test";
import { demoChallengePresets } from "../src/modules/catalog/domain/challenge-preset.ts";
import { rankChallengeSuggestions } from "../src/modules/catalog/domain/discovery.ts";

test("raw shared ownership does not bypass curated challenge suitability", () => {
  const suggestions = rankChallengeSuggestions(
    demoChallengePresets,
    new Set(["dota-2", "rocket-league", "nidhogg"]),
  );

  assert.deepEqual(
    suggestions.map((entry) => entry.preset.id),
    ["dota-2-1v1-mid", "nidhogg-standard", "rocket-league-1v1"],
  );
});

test("pinned challenges always rise to the top of the available set", () => {
  const suggestions = rankChallengeSuggestions(
    demoChallengePresets,
    new Set(["dota-2", "rocket-league", "chess"]),
    new Set(["chess-standard"]),
  );

  assert.equal(suggestions[0]?.preset.id, "chess-standard");
  assert.match(suggestions[0]?.reasons.join(" ") ?? "", /Pinned/);
});

test("games outside the two-player eligible set are not suggested", () => {
  const suggestions = rankChallengeSuggestions(demoChallengePresets, new Set(["nidhogg"]));
  assert.deepEqual(suggestions.map((entry) => entry.preset.gameId), ["nidhogg"]);
});

test("suggestion rail excludes challenges already in the editable pool", () => {
  const suggestions = rankChallengeSuggestions(
    demoChallengePresets,
    new Set(["dota-2", "rocket-league", "nidhogg"]),
    new Set(),
    new Set(["dota-2-1v1-mid", "rocket-league-1v1"]),
  );

  assert.deepEqual(suggestions.map((entry) => entry.preset.id), ["nidhogg-standard"]);
});
