import assert from "node:assert/strict";
import test from "node:test";
import { buildSteamOpenIdLoginUrl, verifySteamOpenIdCallback } from "../src/modules/integrations/steam/steam-openid.ts";
import {
  canonicalGameIdsFromSteamLibrary,
  SteamWebApiLibraryProvider,
  type ImportedGame,
} from "../src/modules/integrations/steam/steam-library-provider.ts";
import { summarizeSteamChallengeAccess } from "../src/modules/integrations/steam/steam-access.ts";
import type { SteamChallengeConnection } from "../src/modules/integrations/steam/sqlite-steam-connection-repository.ts";

test("Steam OpenID login URL targets the expected return URL and realm", () => {
  const value = new URL(buildSteamOpenIdLoginUrl({
    realm: "http://localhost:3000/",
    returnTo: "http://localhost:3000/api/steam/callback?state=abc",
  }));
  assert.equal(value.origin, "https://steamcommunity.com");
  assert.equal(value.pathname, "/openid/login");
  assert.equal(value.searchParams.get("openid.mode"), "checkid_setup");
  assert.equal(value.searchParams.get("openid.realm"), "http://localhost:3000/");
  assert.equal(value.searchParams.get("openid.return_to"), "http://localhost:3000/api/steam/callback?state=abc");
});

test("Steam OpenID callback is verified server-side before extracting SteamID", async () => {
  const expectedReturnTo = "http://localhost:3000/api/steam/callback?state=abc";
  const callback = new URL(expectedReturnTo);
  callback.searchParams.set("openid.mode", "id_res");
  callback.searchParams.set("openid.return_to", expectedReturnTo);
  callback.searchParams.set("openid.claimed_id", "https://steamcommunity.com/openid/id/76561198000000000");
  callback.searchParams.set("openid.identity", "https://steamcommunity.com/openid/id/76561198000000000");
  callback.searchParams.set("openid.signed", "claimed_id,identity,return_to");
  callback.searchParams.set("openid.sig", "fake-signature");

  let verificationBody = "";
  const fakeFetch: typeof fetch = async (_input, init) => {
    verificationBody = String(init?.body ?? "");
    return new Response("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n", { status: 200 });
  };

  const steamId = await verifySteamOpenIdCallback(callback, expectedReturnTo, fakeFetch);
  assert.equal(steamId, "76561198000000000");
  assert.match(verificationBody, /openid.mode=check_authentication/);
});

test("Steam owned games map only to canonical catalog entries with AppID mappings", () => {
  const imported: ImportedGame[] = [
    { provider: "steam", providerGameId: "730", name: "Counter-Strike 2" },
    { provider: "steam", providerGameId: "570", name: "Dota 2" },
    { provider: "steam", providerGameId: "386940", name: "Ultimate Chicken Horse" },
    { provider: "steam", providerGameId: "94400", name: "Nidhogg" },
    { provider: "steam", providerGameId: "291550", name: "Brawlhalla" },
    { provider: "steam", providerGameId: "1091500", name: "Cyberpunk 2077" },
  ];

  assert.deepEqual(canonicalGameIdsFromSteamLibrary(imported), [
    "cs2",
    "dota-2",
    "ultimate-chicken-horse",
    "nidhogg",
    "brawlhalla",
  ]);
});

test("Steam Web API adapter treats hidden libraries as a normal unavailable state", async () => {
  const fakeFetch: typeof fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/IPlayerService/GetOwnedGames/v1/");
    assert.equal(url.searchParams.get("include_appinfo"), "true");
    assert.equal(url.searchParams.get("include_played_free_games"), "true");
    return Response.json({ response: {} });
  };
  const provider = new SteamWebApiLibraryProvider("test-key", fakeFetch);
  const result = await provider.importOwnedGames("76561198000000000");
  assert.equal(result.status, "private-or-unavailable");
  assert.deepEqual(result.games, []);
});

test("mutual Steam access is computed from canonical mapped games only", () => {
  const connection = (role: "host" | "guest", ids: string[]): SteamChallengeConnection => ({
    challengeId: "challenge-1",
    role,
    profile: { steamId: role === "host" ? "1" : "2", personaName: role },
    libraryStatus: "available",
    games: ids.map((providerGameId) => ({ provider: "steam" as const, providerGameId })),
    syncedAt: "2026-08-17T00:00:00.000Z",
  });

  const result = summarizeSteamChallengeAccess([
    connection("host", ["730", "570", "1091500"]),
    connection("guest", ["730", "386940", "1091500"]),
  ]);
  assert.deepEqual(result.mutualCanonicalGameIds, ["cs2"]);
  assert.equal(result.host?.ownedGameCount, 3);
  assert.equal(result.guest?.ownedGameCount, 3);
});
