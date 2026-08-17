import type { MatchPoolSource } from "@/modules/catalog/domain/match-pool";

export type ChallengeStatus = "waiting-for-opponent" | "configuring" | "started";

export type ChallengePoolItem = {
  presetId: string;
  ruleVariantId: string;
  source: MatchPoolSource;
  guestVetoed: boolean;
};

export type PoolProposal =
  | {
      id: string;
      type: "add-challenge";
      presetId: string;
      ruleVariantId: string;
      createdAt: string;
    }
  | {
      id: string;
      type: "change-rules";
      presetId: string;
      ruleVariantId: string;
      createdAt: string;
    };

export type Challenge = {
  id: string;
  hostName: string;
  opponentName: string | null;
  firstTo: number;
  pool: readonly ChallengePoolItem[];
  proposals: readonly PoolProposal[];
  hostReady: boolean;
  guestReady: boolean;
  version: number;
  status: ChallengeStatus;
  sessionId: string | null;
  createdAt: string;
};

export type ChallengeSecrets = {
  hostToken: string;
  inviteToken: string;
};
