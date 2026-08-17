import { prototypeDb } from "./prototype-db";
import { SqliteChallengeRepository } from "@/modules/challenge/infrastructure/sqlite-challenge-repository";
import { SqliteSessionRepository } from "@/modules/gauntlet/infrastructure/sqlite-session-repository";
import { ChallengeService } from "@/modules/challenge/application/challenge-service";

export function prototypeServices() {
  const db = prototypeDb();
  const challenges = new SqliteChallengeRepository(db);
  const sessions = new SqliteSessionRepository(db);
  return {
    db,
    challenges,
    sessions,
    challengeService: new ChallengeService(challenges, sessions),
  };
}
