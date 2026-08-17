# Game discovery, challenge presets, and templates

## Decision

A Steam/library import is **not** the Bro v Bro game picker.

It answers one question:

> What can these two players access?

The product answers a different question:

> Which competitions are actually worth putting in a Bro v Bro?

Those concerns stay separate.

## Three-layer model

### 1. Player game access

Provider imports (Steam first) and manual declarations build each player's accessible library.

Examples:

- Counter-Strike 2 — owned on Steam
- Cyberpunk 2077 — owned on Steam
- Valorant — manually declared
- GeoGuessr — globally/browser accessible

This layer is provider-oriented evidence. A title being present here does **not** mean the UI should recommend it.

### 2. Curated challenge presets

A `ChallengePreset` is the actual competitive unit the product can recommend.

Examples:

- `Dota 2 — 1v1 Mid`
- `Counter-Strike 2 — 1v1`
- `Rocket League — 1v1`
- `GeoGuessr — No Move`
- `Wikipedia Race`
- `Nidhogg`

This handles the case where a large game contains a small competition format without reintroducing a user-configurable rules engine.

Challenge presets carry product curation such as:

- Featured / Recommended / Niche / Manual Only
- tags (FPS, party, strategy, knowledge, creator-popular, etc.)
- lightweight setup notes
- default preset for a game

A game with no suitable preset remains discoverable via library search but does not pollute automatic Bro v Bro suggestions.

### 3. Bro v Bro templates

A `BroVBroTemplate` is a reusable collection of challenge presets.

Template types include:

- official starter
- creator match
- community trending
- genre pack
- user-saved

Examples of the intended UX:

> Play the Bro v Bro everyone is doing

> Play the same Bro v Bro as a creator match

> Start with Party Rivalry and customize it

Templates are **starting points**, not immutable tournament formats. Applying a template against two players performs a compatibility pass:

- available to both → ready
- only one has it → needs install/access
- neither has it → unavailable
- browser/global challenge → ready

The players can replace unavailable entries before starting.

## Build flow

```text
Player A library ─┐
                  ├─> Access intersection ─┐
Player B library ─┘                       │
                                          ├─> Curated Challenge Presets ─> Suggestions
Global/browser challenges ────────────────┘                 │
                                                            │
Pinned / guaranteed picks ──────────────────────────────────┤
                                                            │
Selected Template ──────────────────────────────────────────┘
                                                            │
                                                            v
                                                    Match Game Pool
```

## Suggested setup experience

The create screen should bias toward action rather than showing a giant library grid.

1. **Guaranteed picks** — search and pin `Dota 2 — 1v1 Mid`, etc.
2. **Suggested for both of you** — ranked curated challenges both players can access.
3. **Templates** — starter, trending, creator, or saved playlists.
4. **Browse all** — full library/catalog escape hatch when the user knows exactly what they want.

Steam-only shared titles that have low/no Bro v Bro suitability should remain behind Browse/Search instead of appearing in the default suggestion rail.

## Recommendation behavior for MVP

No ML system is needed.

Start with deterministic weighting:

- curated suitability
- mutual access
- pinned/guaranteed selections
- creator-popular tag
- installed/readiness later when that signal exists
- template/community usage later when telemetry exists

The important invariant is:

> **Shared ownership is an eligibility signal, never sufficient recommendation evidence.**

## Template versioning

Creator/community templates should have stable IDs plus versions/date labels. A completed match should retain the exact challenge list it used even if the public template is edited later.

A public match can expose **Play This Bro v Bro**, which creates a new editable challenge from a snapshot of that match's presets while preserving source attribution.
