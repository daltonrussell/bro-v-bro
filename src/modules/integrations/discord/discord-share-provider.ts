export type DiscordLiveMatchCard = {
  title: string;
  scoreLine: string;
  currentGame?: string;
  nextSelector?: string;
  matchUrl: string;
};

export interface DiscordShareProvider {
  postLiveMatch(card: DiscordLiveMatchCard): Promise<{ messageId: string }>;
  updateLiveMatch(messageId: string, card: DiscordLiveMatchCard): Promise<void>;
}
