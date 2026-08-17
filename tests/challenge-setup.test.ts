import assert from "node:assert/strict";
import test from "node:test";
import { demoChallengePresets } from "../src/modules/catalog/domain/challenge-preset.ts";
import {
  acceptProposal,
  addPoolItem,
  addProposal,
  assertStartable,
  changePoolRules,
  setGuestVeto,
  setReady,
} from "../src/modules/challenge/domain/setup.ts";
import type { Challenge, PoolProposal } from "../src/modules/challenge/domain/types.ts";

function baseChallenge(): Challenge {
  return {
    id: "challenge-1",
    hostName: "You",
    opponentName: "Rival",
    firstTo: 3,
    pool: [],
    proposals: [],
    hostReady: false,
    guestReady: false,
    version: 1,
    status: "configuring",
    sessionId: null,
    createdAt: "2026-08-17T00:00:00.000Z",
  };
}

const preset = (id: string) => {
  const value = demoChallengePresets.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`missing preset ${id}`);
  return value;
};

test("canonical pool changes reset both readiness flags", () => {
  let challenge = addPoolItem(baseChallenge(), preset("rocket-league-1v1"));
  challenge = setReady(challenge, "host", true);
  challenge = setReady(challenge, "guest", true);
  assert.equal(challenge.hostReady, true);
  assert.equal(challenge.guestReady, true);

  challenge = addPoolItem(challenge, preset("nidhogg-standard"));
  assert.equal(challenge.hostReady, false);
  assert.equal(challenge.guestReady, false);
});

test("guest veto blocks readiness until withdrawn", () => {
  let challenge = addPoolItem(baseChallenge(), preset("rocket-league-1v1"));
  challenge = setGuestVeto(challenge, "rocket-league-1v1", true);
  assert.throws(() => setReady(challenge, "guest", true), /Resolve vetoed challenges/);

  challenge = setGuestVeto(challenge, "rocket-league-1v1", false);
  challenge = setReady(challenge, "guest", true);
  assert.equal(challenge.guestReady, true);
});

test("guest rule suggestion does not mutate the pool until host accepts it", () => {
  let challenge = addPoolItem(baseChallenge(), preset("geoguessr-duel"));
  const proposal: PoolProposal = {
    id: "proposal-1",
    type: "change-rules",
    presetId: "geoguessr-duel",
    ruleVariantId: "no-move-no-zoom",
    createdAt: "2026-08-17T00:00:00.000Z",
  };
  challenge = addProposal(challenge, proposal);
  assert.equal(challenge.pool[0]?.ruleVariantId, "no-move");

  challenge = acceptProposal(challenge, proposal.id, demoChallengePresets);
  assert.equal(challenge.pool[0]?.ruleVariantId, "no-move-no-zoom");
  assert.equal(challenge.proposals.length, 0);
});

test("host can edit a curated ruleset directly", () => {
  let challenge = addPoolItem(baseChallenge(), preset("geoguessr-duel"));
  challenge = changePoolRules(challenge, preset("geoguessr-duel"), "no-rules");
  assert.equal(challenge.pool[0]?.ruleVariantId, "no-rules");
});

test("start requires both readiness and enough no-repeat challenges", () => {
  let challenge = baseChallenge();
  for (const id of [
    "rocket-league-1v1",
    "nidhogg-standard",
    "geoguessr-duel",
    "wikipedia-race-standard",
    "chess-standard",
  ]) {
    challenge = addPoolItem(challenge, preset(id));
  }
  assert.throws(() => assertStartable(challenge), /Both players must be ready/);
  challenge = setReady(challenge, "host", true);
  challenge = setReady(challenge, "guest", true);
  assert.doesNotThrow(() => assertStartable(challenge));
});
