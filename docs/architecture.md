# Bro v Bro — MVP Architecture

## Architecture goal

Keep the match loop authoritative and boring while integrations remain replaceable.

The first product is a web-first modular monolith. We deliberately do **not** begin with microservices, an event bus, a universal skill model, per-game result APIs, or native install detection.

## Core state machine

```text
AWAITING_COIN_FLIP
       |
       v
SELECTING_GAME <-------------------------------+
       |                                       |
       v                                       |
ROUND_READY                                    |
       |                                       |
       v                                       |
AWAITING_RESULT -- confirmed winner --> score--+
       |                                  |
       |                                  +--> loser becomes next selector
       +--------------------------------------> COMPLETED when firstTo reached
```

### Invariants

1. Coin flip happens once and is persisted.
2. Only `selectorId` may lock the next game.
3. A random pick is generated server-side and persisted before reveal animation.
4. A round contributes at most one point.
5. After a non-final round, the loser becomes `selectorId`.
6. Completed sessions are immutable. A rematch creates a new session/challenge.
7. Steam/Discord never directly mutate match state.

## Module boundaries

### `gauntlet/domain`
Pure state-machine rules. No Next.js, HTTP, Steam, Discord, or database imports.

### `gauntlet/application`
Coordinates commands, repositories, authentication/authorization, idempotency, and optimistic concurrency.

### `catalog/domain`
Canonical game identity. Steam/Epic/browser/manual entries map into this model.

### `integrations/steam`
Adapter for Steam sign-in/library import. Privacy/API failures degrade to manual game entry.

### `integrations/discord`
Adapter for live/final match cards. Discord Rich Presence is intentionally separate and post-MVP.

### `web`
Next.js UI/BFF. It renders state and sends commands; it is not the source of truth.

## Persistence recommendation

PostgreSQL first. Suggested tables:

- `users`
- `provider_identities`
- `games`
- `provider_game_mappings`
- `player_game_access`
- `challenges`
- `challenge_participants`
- `gauntlet_sessions`
- `gauntlet_game_pool`
- `round_results`
- `discord_match_bindings`

`gauntlet_sessions.version` provides optimistic concurrency. Commands should carry an expected version and an idempotency key.

## Next slices

1. Persist the current prototype session in PostgreSQL.
2. Add two-browser participant identity + invite URL.
3. Split result reporting into submit/confirm.
4. Add canonical catalog search/manual game entry.
5. Add Steam OpenID + public library import.
6. Generate share image from the same match-summary projection used by the victory UI.
7. Add Discord rich live-match message.
