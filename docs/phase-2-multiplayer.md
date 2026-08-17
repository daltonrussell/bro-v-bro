# Phase 2 — Real two-player match loop

## Goal

Prove that the core Bro v Bro is useful before adding Steam, matchmaking, or game-specific integrations.

Two independent browser sessions should be able to complete one authoritative gauntlet without trusting either browser as the source of truth.

## User flow

```text
Host
  │
  ├─ create challenge
  │     ├─ display name
  │     ├─ first-to score
  │     └─ eligible game pool
  │
  ├─ receives private host token + invite URL
  │
  └──────────── send invite ───────────────┐
                                           │
                                        Rival
                                           │
                                           ├─ open invite
                                           ├─ choose display name
                                           └─ join

                     server creates GauntletSession
                                  │
                                  v
                         AWAITING_COIN_FLIP
                                  │
                                  v
                           SELECTING_GAME
                                  │
                                  v
                             ROUND_READY
                                  │
                                  v
                           AWAITING_RESULT
                                  │
                                  v
                    AWAITING_RESULT_CONFIRMATION
                      │ confirm           │ dispute
                      v                   └──> AWAITING_RESULT
                apply point
                      │
            ┌─────────┴─────────┐
            v                   v
      SELECTING_GAME         COMPLETED
   loser becomes selector        │
                                 v
                           victory/share card
```

## Identity choice for this phase

Do not force account creation yet.

Each challenge generates:

- `hostToken` — authorizes Player A after a rival joins
- `inviteToken` — authorizes claiming Player B's open slot
- `opponentToken` — returned once Player B joins

Only token hashes are persisted. Once the session exists, the server maps participant token hashes to `player-a` / `player-b`.

This is deliberately replaceable by real account auth later.

## Persistence

The prototype adapter stores complete `GauntletSession` JSON plus a version in local SQLite.

Why store the aggregate as JSON in the prototype instead of normalizing every field now?

1. The domain aggregate is still changing quickly.
2. We want to validate state transitions, not optimize reporting queries yet.
3. The production PostgreSQL schema already documents the normalized direction.
4. Repository boundaries keep the persistence decision outside the domain.

## Concurrency

Every command sends:

- `expectedVersion`
- `idempotencyKey`

The repository:

1. returns current state for an already-processed idempotency key;
2. updates only where `version = expectedVersion`;
3. records the command key in the same SQLite transaction.

Concurrent stale commands return HTTP `409` and the client refreshes the authoritative state.

## Result trust model

Friend MVP uses mutual confirmation:

```text
A reports: "B won Rocket League"
          ↓
state = awaiting-result-confirmation
          ↓
B confirms → score advances
B disputes → current game returns to awaiting-result
```

The reporter cannot confirm or dispute their own report.

This is enough for friend-vs-friend validation. Automated third-party result verification is explicitly deferred.

## Realtime choice

Current implementation uses ~1.2 second polling on the match page and ~1.5 second polling in the lobby.

That is intentional for the first deployable slice. The command/state contracts are transport-agnostic, so SSE/WebSockets can replace polling when:

- live viewer pages matter;
- Discord/OBS surfaces need fast updates;
- built-in synchronous games exist.

## Production hardening after validation

- PostgreSQL repository + transaction boundaries
- real user/account sessions
- CSRF/session-cookie model instead of URL participant secrets
- explicit challenge expiration/revocation UI
- public share tokens separate from participant authorization
- structured telemetry and command/error audit
- rate limiting
