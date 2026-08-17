# Host-authoritative setup

## Decision

Bro v Bro setup is **not** collaborative editing.

The host owns the canonical challenge pool. The guest participates through proposals, vetoes, and readiness.

This keeps the setup workflow social without requiring merge/conflict-resolution semantics.

## Ownership model

| Action | Host | Guest |
| --- | --- | --- |
| Add challenge | Yes | Suggest |
| Remove challenge | Yes | Veto |
| Change ruleset | Yes | Suggest |
| Apply template | Future host action | No |
| Veto challenge | N/A (host can remove) | Yes |
| Ready up | Yes | Yes |
| Start Bro v Bro | Yes | No |

A guest veto is blocking. The host cannot override it; the veto must be withdrawn or the challenge removed.

## Aggregate boundary

```text
                    ┌────────────────────────┐
Host commands ─────▶│                        │
                    │      Challenge         │──── canonical MatchPool
Guest veto ────────▶│   (mutable setup)      │
                    └───────────┬────────────┘
                                │ accepts
                                ▼
                    ┌────────────────────────┐
Guest suggestions ─▶│      Proposals         │
                    │      (advisory)         │
                    └────────────────────────┘

Both ready + no vetoes + sufficient pool
                                │
                                ▼
                    ┌────────────────────────┐
                    │    GauntletSession     │
                    │ immutable setup        │
                    │ snapshot + live state  │
                    └────────────────────────┘
```

`Challenge` owns:

- participants during setup
- First-to target
- canonical challenge pool
- selected curated rule variants
- guest veto state
- guest proposals
- host/guest readiness
- setup version
- eventual session ID

`GauntletSession` owns:

- the exact agreed preset + rule-variant snapshot
- coin flip
- current selector
- current game
- result confirmation
- score
- game-by-game ledger
- winner

Joining a challenge never creates the live session. The session is created only when the host starts a valid setup.

## Readiness invariant

Any canonical setup mutation resets both readiness flags:

- add challenge
- remove challenge
- change rules
- apply/withdraw a veto
- future template application

Guest proposals do **not** reset readiness because they do not alter the canonical setup.

Start requires:

1. guest has joined
2. host ready
3. guest ready
4. no vetoed pool items
5. at least `2 * firstTo - 1` challenges for the no-repeat MVP format

## Concurrency

The setup record is versioned and stored separately from participant secrets. Writes use optimistic compare-and-swap semantics. A stale write is rejected rather than merged.

Because only the host mutates the canonical pool, conflict cases are limited to duplicate browser actions/retries rather than two users editing the same object.

## Provider integration

Steam, Epic, Discord, templates, and future recommendation systems may **suggest** or provide eligibility data, but they never bypass the Challenge aggregate.

Steam library import should eventually feed the suggestion rail:

```text
player access intersection
        +
curated Bro v Bro suitability
        +
current pool exclusions
        ↓
contextual suggestions
```

The host still explicitly adds any suggestion to the canonical pool.
