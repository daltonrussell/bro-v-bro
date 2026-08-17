# ADR-001: Start as a modular monolith

**Status:** Accepted

## Context

The product has several future integration surfaces (Steam, Discord, browser activities, potentially native desktop), but the MVP's hard problem is maintaining a correct two-player match state while product rules are still changing.

## Decision

Build a single deployable Next.js application backed by PostgreSQL, with explicit domain/application/integration module boundaries in source code.

Provider adapters implement contracts consumed by application services. The gauntlet domain imports no framework or provider code.

## Consequences

### Positive
- Fast iteration and cheap deployment.
- Transactions are straightforward.
- Domain logic remains independently testable.
- We preserve seams that can become services later if scale demands it.

### Negative
- Module boundaries rely on engineering discipline rather than network isolation.
- Long-running realtime/native game workloads may eventually deserve separate processes.

## Explicit non-decisions

We are not adopting microservices, Kafka, Redis Streams, event sourcing, Kubernetes, or a separate game service in MVP.
