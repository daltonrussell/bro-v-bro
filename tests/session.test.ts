import assert from "node:assert/strict";
import test from "node:test";
import {
  applyCoinFlip,
  chooseRandomGame,
  confirmReportedWinner,
  createSession,
  disputeReportedWinner,
  reportWinner,
  selectGame,
  startRound,
} from "../src/modules/gauntlet/domain/session.ts";

const base = () => createSession({ id: "test", firstTo: 2, eligibleGameIds: ["cs2", "rl", "geo"], playerAName: "A", playerBName: "B" });

function playing() {
  let session = applyCoinFlip(base(), "player-a");
  session = selectGame(session, "player-a", "cs2");
  return startRound(session);
}

test("coin flip winner gets first selection", () => {
  const session = applyCoinFlip(base(), "player-b");
  assert.equal(session.status, "selecting-game");
  assert.equal(session.selectorId, "player-b");
});

test("reported result does not change score until the opponent confirms", () => {
  const session = reportWinner(playing(), "player-a", "player-a");
  assert.deepEqual(session.score, { "player-a": 0, "player-b": 0 });
  assert.equal(session.status, "awaiting-result-confirmation");
  assert.throws(() => confirmReportedWinner(session, "player-a"), /cannot confirm their own/);
});

test("loser of a confirmed round gets the next pick", () => {
  let session = reportWinner(playing(), "player-a", "player-a");
  session = confirmReportedWinner(session, "player-b");
  assert.equal(session.score["player-a"], 1);
  assert.equal(session.selectorId, "player-b");
  assert.equal(session.status, "selecting-game");
});

test("a disputed result returns the same game to awaiting-result", () => {
  let session = reportWinner(playing(), "player-a", "player-a");
  session = disputeReportedWinner(session, "player-b");
  assert.equal(session.status, "awaiting-result");
  assert.equal(session.currentGameId, "cs2");
  assert.equal(session.pendingResult, null);
});

test("series completes when a player reaches firstTo", () => {
  let session = reportWinner(playing(), "player-a", "player-a");
  session = confirmReportedWinner(session, "player-b");
  session = selectGame(session, "player-b", "rl");
  session = startRound(session);
  session = reportWinner(session, "player-b", "player-a");
  session = confirmReportedWinner(session, "player-a");
  assert.equal(session.status, "completed");
  assert.equal(session.winnerId, "player-a");
  assert.deepEqual(session.score, { "player-a": 2, "player-b": 0 });
});

test("random selector is deterministic when an RNG is injected", () => {
  const session = applyCoinFlip(base(), "player-a");
  assert.equal(chooseRandomGame(session, () => 0.99), "geo");
});

test("a game cannot be replayed in the default MVP rules", () => {
  let session = reportWinner(playing(), "player-a", "player-a");
  session = confirmReportedWinner(session, "player-b");
  assert.throws(() => selectGame(session, "player-b", "cs2"), /already been played/);
});
