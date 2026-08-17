export type BroVBroTemplateType =
  | "official-starter"
  | "creator-match"
  | "community-trending"
  | "genre-pack"
  | "user-saved";

export type BroVBroTemplate = {
  id: string;
  name: string;
  description: string;
  type: BroVBroTemplateType;
  challengePresetIds: readonly string[];
  sourceName?: string;
  sourceUrl?: string;
  versionLabel?: string;
  featured?: boolean;
};

/**
 * Templates are starting points, not locked playlists. When applied to a pair
 * of players, unavailable challenges are flagged and can be swapped before the
 * Bro v Bro begins.
 */
export const demoTemplates: readonly BroVBroTemplate[] = [
  {
    id: "starter-five",
    name: "Starter 5",
    description: "A varied five-game starter set that demonstrates what Bro v Bro is about.",
    type: "official-starter",
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
    challengePresetIds: [
      "ultimate-chicken-horse-race",
      "wikipedia-race-standard",
      "geoguessr-no-move",
      "nidhogg-standard",
    ],
    featured: true,
  },
];
