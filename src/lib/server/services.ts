import { prototypeDb } from "./prototype-db";
import { SqliteChallengeRepository } from "@/modules/challenge/infrastructure/sqlite-challenge-repository";
import { SqliteSessionRepository } from "@/modules/gauntlet/infrastructure/sqlite-session-repository";
import { ChallengeService } from "@/modules/challenge/application/challenge-service";
import { SqliteSteamConnectionRepository } from "@/modules/integrations/steam/sqlite-steam-connection-repository";
import { SteamWebApiLibraryProvider } from "@/modules/integrations/steam/steam-library-provider";

export function prototypeServices() {
  const db = prototypeDb();
  const challenges = new SqliteChallengeRepository(db);
  const sessions = new SqliteSessionRepository(db);
  const steamConnections = new SqliteSteamConnectionRepository(db);
  const steamLibrary = new SteamWebApiLibraryProvider(process.env.STEAM_WEB_API_KEY ?? "");
  return {
    db,
    challenges,
    sessions,
    steamConnections,
    steamLibrary,
    challengeService: new ChallengeService(challenges, sessions),
  };
}
