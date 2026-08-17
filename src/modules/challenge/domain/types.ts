export type Challenge = {
  id: string;
  hostName: string;
  opponentName: string | null;
  firstTo: number;
  gameIds: readonly string[];
  sessionId: string | null;
  createdAt: string;
};

export type ChallengeSecrets = {
  hostToken: string;
  inviteToken: string;
};
