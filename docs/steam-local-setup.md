# Steam integration — local setup

Steam is an optional discoverability integration. A player can always configure a Bro v Bro manually if Steam is disconnected or their library is private.

## Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
STEAM_WEB_API_KEY=your_server_side_key
BVB_PUBLIC_ORIGIN=http://localhost:3000
```

Keep `STEAM_WEB_API_KEY` server-only. Do not expose it through a `NEXT_PUBLIC_` variable or client-side request.

Start the app normally:

```bash
npm install
npm run dev
```

## Linking flow

The setup-room UI will eventually send a participant to:

```text
GET /api/challenges/:challengeId/steam/start?token=:participantToken
```

The server:

1. verifies that the challenge token belongs to the host or guest;
2. creates a short-lived link-state record;
3. redirects the browser to Steam OpenID;
4. verifies Steam's OpenID callback server-side;
5. extracts the returned 64-bit SteamID;
6. fetches the Steam profile and owned-games list;
7. stores the imported library as provider evidence for that challenge participant;
8. redirects back to the setup room.

The setup room can read the sanitized access projection through:

```text
GET /api/challenges/:challengeId/steam?token=:participantToken
```

The response contains connection/profile status, the subset of the library that maps to canonical Bro v Bro games, and `mutualCanonicalGameIds` when both libraries are available. It does not expose the other participant's raw Steam library.

## Privacy / failure behavior

A missing or hidden owned-games list is represented as `private-or-unavailable`. It is not a fatal challenge error. The manual/curated setup flow remains available.

Steam ownership is an access/discoverability signal only. Importing a game does not add it to the canonical match pool and does not make it a Bro v Bro recommendation unless the catalog has a curated challenge preset for it.

## Current catalog mappings

The prototype currently has Steam AppID mappings for the curated titles used by discovery:

- Counter-Strike 2
- Dota 2
- Ultimate Chicken Horse
- Nidhogg
- Brawlhalla

Additional mappings should be added to the canonical game catalog rather than embedded in Steam-specific UI code.
