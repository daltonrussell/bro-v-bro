export type BroVBroTemplateType =
  | "official-starter"
  | "creator-match"
  | "community-trending"
  | "genre-pack"
  | "user-saved";

export type TemplateSelectionBehavior = "loser-picks-pool" | "ordered-replay" | "random-pool";

export type BroVBroTemplate = {
  id: string;
  name: string;
  description: string;
  type: BroVBroTemplateType;
  challengePresetIds: readonly string[];
  selectionBehavior: TemplateSelectionBehavior;
  sourceName?: string;
  sourceUrl?: string;
  versionLabel?: string;
  featured?: boolean;
};

/**
 * Templates seed an editable match pool; they are not locked tournaments.
 * Compatibility is shown per item, but the product never auto-replaces a game.
 * Players can remove entries, change supported rulesets, and add mutually
 * accessible suggestions before the match begins.
 *
 * For normal Bro v Bro matches the template defines the pool while
 * loser-picks-next determines actual play order. Ordered replay remains
 * available for formats where reproducing a known sequence matters.
 */
export const demoTemplates: readonly BroVBroTemplate[] = [
  {
    id: "starter-five",
    name: "Starter 5",
    description: "A varied five-game starter set that demonstrates what Bro v Bro is about.",
    type: "official-starter",
    selectionBehavior: "loser-picks-pool",
    challengePresetIds: [
      "cs2-1v1",
      "rocket-league-1v1",
      "geoguessr-duel",
      "wikipedia-race-standard",
      "nidhogg-standard",
    ],
    featured: true,
  },
  {
    id: "party-rivalry",
    name: "Party Rivalry",
    description: "Fast, readable competitions that work well with friends and spectators.",
    type: "genre-pack",
    selectionBehavior: "loser-picks-pool",
    challengePresetIds: [
      "ultimate-chicken-horse-race",
      "wikipedia-race-standard",
      "geoguessr-duel",
      "nidhogg-standard",
    ],
    featured: true,
  },
];
