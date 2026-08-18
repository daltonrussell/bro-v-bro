import { prototypeServices } from "@/lib/server/services";
import { publicOrigin, verifySteamOpenIdCallback } from "@/modules/integrations/steam/steam-openid";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const callbackUrl = new URL(request.url);
  const state = callbackUrl.searchParams.get("state") ?? "";
  const { steamConnections, steamLibrary } = prototypeServices();
  const link = steamConnections.getLinkState(state);
  if (!link) return Response.json({ error: "Steam link state is missing or expired" }, { status: 400 });

  try {
    const origin = publicOrigin(request.url, process.env.BVB_PUBLIC_ORIGIN);
    const expectedReturnTo = `${origin}/api/steam/callback?state=${encodeURIComponent(state)}`;
    const steamId = await verifySteamOpenIdCallback(callbackUrl, expectedReturnTo);
    const [profile, library] = await Promise.all([
      steamLibrary.getProfile(steamId),
      steamLibrary.importOwnedGames(steamId),
    ]);

    steamConnections.upsertConnection({
      challengeId: link.challengeId,
      role: link.role,
      profile,
      libraryStatus: library.status,
      games: library.games,
      syncedAt: new Date().toISOString(),
    });
    steamConnections.deleteLinkState(state);

    const target = new URL(`/challenge/${link.challengeId}`, origin);
    target.searchParams.set("token", link.participantToken);
    target.searchParams.set("steam", "connected");
    return Response.redirect(target);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to connect Steam" }, { status: 400 });
  }
}
