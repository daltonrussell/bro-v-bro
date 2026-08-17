export type PlayerId = "player-a" | "player-b";

export type Player = {
  id: PlayerId;
  displayName: string;
  initials: string;
};

export type MatchFormat = {
  firstTo: number;
};

export type PendingRoundResult = {
  gameId: string;
  reportedBy: PlayerId;
  winnerId: PlayerId;
};

export type RoundResult = {
  roundNumber: number;
  gameId: string;
  selectedBy: PlayerId;
  winnerId: PlayerId;
  confirmedBy: PlayerId;
};

export type SessionStatus =
  | "awaiting-coin-flip"
  | "selecting-game"
  | "round-ready"
  | "awaiting-result"
  | "awaiting-result-confirmation"
  | "completed";

export type GauntletSession = {
  id: string;
  players: readonly [Player, Player];
  format: MatchFormat;
  eligibleGameIds: readonly string[];
  usedGameIds: readonly string[];
  status: SessionStatus;
  selectorId: PlayerId | null;
  currentGameId: string | null;
  pendingResult: PendingRoundResult | null;
  rounds: readonly RoundResult[];
  score: Record<PlayerId, number>;
  winnerId: PlayerId | null;
  version: number;
};
