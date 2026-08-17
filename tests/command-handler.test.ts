import assert from "node:assert/strict";
import test from "node:test";
import { executeSessionCommand } from "../src/modules/gauntlet/application/execute-command.ts";
import type { GauntletSessionRepository } from "../src/modules/gauntlet/application/session-repository.ts";
import { createSession } from "../src/modules/gauntlet/domain/session.ts";
import type { GauntletSession } from "../src/modules/gauntlet/domain/types.ts";

class FakeRepository implements GauntletSessionRepository {
  session: GauntletSession;
  commands = new Set<string>();

  constructor(session: GauntletSession) { this.session = session; }
  async getById(id: string) { return this.session.id === id ? this.session : null; }
  async create(session: GauntletSession) { this.session = session; }
  async hasProcessedCommand(sessionId: string, key: string) { return this.commands.has(`${sessionId}:${key}`); }
  async save(session: GauntletSession, options: { expectedVersion: number; idempotencyKey: string }) {
    if (this.commands.has(`${session.id}:${options.idempotencyKey}`)) return "duplicate" as const;
    if (this.session.version !== options.expectedVersion) throw new Error("conflict");
    this.session = session;
    this.commands.add(`${session.id}:${options.idempotencyKey}`);
    return "saved" as const;
  }
}

const initial = () => createSession({ id: "session", firstTo: 2, eligibleGameIds: ["cs2", "rl", "geo"], playerAName: "A", playerBName: "B" });

test("server-side coin flip uses injected randomness and persists the result", async () => {
  const repo = new FakeRepository(initial());
  const result = await executeSessionCommand({
    repository: repo,
    random: () => 0.9,
    envelope: { sessionId: "session", actorId: "player-a", expectedVersion: 1, idempotencyKey: "flip", command: { type: "FLIP_FOR_FIRST_PICK" } },
  });
  assert.equal(result.selectorId, "player-b");
  assert.equal(repo.session.selectorId, "player-b");
});

test("an idempotent retry returns current state before stale-version rejection", async () => {
  const repo = new FakeRepository(initial());
  const envelope = { sessionId: "session", actorId: "player-a" as const, expectedVersion: 1, idempotencyKey: "same", command: { type: "FLIP_FOR_FIRST_PICK" as const } };
  const first = await executeSessionCommand({ repository: repo, random: () => 0.1, envelope });
  const retry = await executeSessionCommand({ repository: repo, random: () => 0.9, envelope });
  assert.equal(retry.version, first.version);
  assert.equal(retry.selectorId, first.selectorId);
});
