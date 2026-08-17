# MVP command/query API shape

The HTTP shape should mirror application commands rather than exposing database CRUD.

## Queries

- `GET /api/challenges/:id`
- `GET /api/sessions/:id`
- `GET /api/sessions/:id/share`
- `GET /api/catalog/games?q=`

## Commands

- `POST /api/challenges`
- `POST /api/challenges/:id/join`
- `POST /api/challenges/:id/game-pool`
- `POST /api/sessions/:id/commands`

Example command body:

```json
{
  "expectedVersion": 7,
  "idempotencyKey": "5c6f...",
  "command": {
    "type": "SELECT_GAME",
    "actorId": "player-b",
    "gameId": "rocket-league"
  }
}
```

On a stale `expectedVersion`, return `409 Conflict` with the latest session snapshot. This keeps the two browsers from double-awarding wins or selecting two games concurrently.
