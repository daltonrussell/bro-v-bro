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
 * Templates are starting points, not locked tournaments. For the normal Bro v Bro
 * format they usually define the shared challenge pool while loser-picks-next
 * determines the actual play order. Ordered replay remains available for formats
 * where reproducing the exact sequence matters.
 *
 * When applied to a pair of players, unavailable challenges are flagged and can
 * be swapped before the Bro v Bro begins.
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
      "geoguessr-no-move",
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
      "geoguessr-no-move",
      "nidhogg-standard",
    ],
    featured: true,
  },
];
