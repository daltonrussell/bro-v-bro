import { randomUUID } from "node:crypto";
import { createSession } from "@/modules/gauntlet/domain/session";
import type { GauntletSessionRepository } from "@/modules/gauntlet/application/session-repository";
import type { Challenge } from "../domain/types";
import { SqliteChallengeRepository } from "../infrastructure/sqlite-challenge-repository";
import { newToken } from "../infrastructure/token";

export class ChallengeService {
  constructor(
    private readonly challenges: SqliteChallengeRepository,
    private readonly sessions: GauntletSessionRepository,
  ) {}

  create(input: { hostName: string; firstTo: number; gameIds: readonly string[] }) {
    if (!input.hostName.trim()) throw new Error("Host name is required");
    if (input.firstTo < 1 || input.firstTo > 9) throw new Error("firstTo must be between 1 and 9");
    const maximumRounds = input.firstTo * 2 - 1;
    if (input.gameIds.length < maximumRounds) throw new Error(`Choose at least ${maximumRounds} games for a no-repeat first-to-${input.firstTo}`);

    const id = randomUUID();
    const hostToken = newToken();
    const inviteToken = newToken();
    const challenge: Challenge = {
      id,
      hostName: input.hostName.trim(),
      opponentName: null,
      firstTo: input.firstTo,
      gameIds: [...new Set(input.gameIds)],
      sessionId: null,
      createdAt: new Date().toISOString(),
    };
    this.challenges.create({ ...challenge, hostToken, inviteToken });
    return { challenge, hostToken, inviteToken };
  }

  async join(input: { challengeId: string; inviteToken: string; opponentName: string }) {
    const challenge = this.challenges.get(input.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (!this.challenges.verifyInvite(input.challengeId, input.inviteToken)) throw new Error("Invite is invalid");
    if (challenge.sessionId) throw new Error("Challenge has already been joined");
    if (!input.opponentName.trim()) throw new Error("Opponent name is required");

    const opponentToken = newToken();
    const sessionId = randomUUID();
    const session = createSession({
      id: sessionId,
      firstTo: challenge.firstTo,
      eligibleGameIds: challenge.gameIds,
      playerAName: challenge.hostName,
      playerBName: input.opponentName.trim(),
    });
    await this.sessions.create(session);
    this.challenges.join(challenge.id, input.opponentName.trim(), opponentToken, sessionId);
    this.challenges.bindSessionAccessFromChallenge(challenge.id, sessionId);
    return { session, opponentToken };
  }
}
