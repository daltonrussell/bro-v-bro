# Game discovery, editable pools, and templates

## Core decision

A Steam/library import is **not** the Bro v Bro game picker.

- library/access data answers: **what can these two players access?**
- the curated challenge catalog answers: **what is actually worth competing in?**
- the match pool answers: **what do these two players want available in this Bro v Bro?**

Shared ownership is an eligibility signal, never sufficient recommendation evidence.

## Product layers

### 1. Player access

Provider imports (Steam first), manual declarations, and global/browser availability build each player's access set. A title such as Cyberpunk 2077 can be present here without ever becoming a default suggestion.

### 2. Challenge presets and rule variants

A `ChallengePreset` is a curated competition mode rather than merely a game title: `Dota 2 — 1v1 Mid`, `Rocket League — 1v1`, `GeoGuessr`, `Wikipedia Race`, or `Nidhogg`.

Each challenge may expose a small set of curated `RuleVariant`s. The pool stores the chosen variant separately from the base challenge.

```text
GeoGuessr — No Move            [Edit] [Remove]

Edit ruleset:
  ● No Move
  ○ No Move + No Zoom
  ○ No Rules
```

The default rule variant is selected when the challenge is added. Players can edit it before the match starts. MVP does **not** require arbitrary free-form rule authoring.

### 3. Bro v Bro templates

A `BroVBroTemplate` is a reusable starting pool: official starter, creator recreation, community/trending set, genre pack, or user-saved template.

For the normal format, a template copies the **pool**, not necessarily the play order. Coin flip + loser-picks-next still determines what gets played next.

Template selection behavior supports `loser-picks-pool`, `ordered-replay`, and `random-pool`.

### 4. Editable match pool

Applying a template creates an editable pre-match pool. It does not launch a replacement wizard.

Every item shows compatibility/readiness, ruleset, Edit, and Remove. Unavailable items remain visible until players explicitly remove them.

Below the pool, the UI shows **Suggested for both of you**. Suggestions require mutual/global access and a clear curated head-to-head mode, exclude challenges already in the pool, prioritize Featured/Recommended options, and append with one **Add** click.

```text
YOUR BRO V BRO

Rocket League — 1v1                 ✓ both have it   [Remove]
Dota 2 — 1v1 Mid                    ✓ both have it   [Remove]
GeoGuessr — No Move                 ✓ browser        [Edit] [Remove]
Nidhogg                             ↓ Rival needs it [Remove]

SUGGESTED FOR BOTH OF YOU

Ultimate Chicken Horse — Versus    ✓ both have it   [+ Add]
CS2 — 1v1                           ✓ both have it   [+ Add]
Chess                               ✓ browser        [+ Add]
```

There is deliberately no **Replace unavailable** action. The product should feel like editing a playlist: add what looks good, remove what does not, and edit the challenge variant where appropriate.

## Setup flow

```text
Template / empty pool
        │
        v
Editable Match Pool <──── Search / guaranteed picks
        │
        ├──── Edit ruleset
        ├──── Remove
        │
        v
Suggested for both players
        │
        └──── + Add ───────────────> Editable Match Pool
        │
        v
Lock pool when match starts
```

The suggestion engine stays deterministic for MVP. Useful signals are curated suitability, mutual access, creator-popular tag, and later installed state/community usage. No ML recommender is required.

## Pinned versus must-play

A pinned/guaranteed setup pick means **keep this challenge in the selectable pool**. It does not require the challenge to be played if the overall match ends first. A future `must-play` feature would change match-completion semantics and should remain separate.

## Snapshot/versioning rule

The live match uses a snapshot of the final pre-match pool including the selected rule variant for every challenge. Editing a public template later must never mutate an existing or completed match.

A public creator/community match can expose **Play This Bro v Bro**, which creates a new editable pool from that snapshot while retaining source attribution. Until a creator explicitly partners with the product, recreated creator templates should be labeled as community/source-attributed rather than official or endorsed.
