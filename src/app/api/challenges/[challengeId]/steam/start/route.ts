import { randomBytes } from "node:crypto";
import { prototypeServices } from "@/lib/server/services";
import { buildSteamOpenIdLoginUrl, publicOrigin } from "@/modules/integrations/steam/steam-openid";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const { challengeService, steamConnections, steamLibrary } = prototypeServices();
  const role = challengeService.resolveViewer(challengeId, token);
  if (role !== "host" && role !== "guest") return Response.json({ error: "Participant token required" }, { status: 401 });
  if (!steamLibrary.configured) {
    return Response.json({ error: "Steam integration requires STEAM_WEB_API_KEY" }, { status: 503 });
  }

  const origin = publicOrigin(request.url, process.env.BVB_PUBLIC_ORIGIN);
  const state = randomBytes(24).toString("hex");
  steamConnections.createLinkState({
    state,
    challengeId,
    role,
    participantToken: token,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  const returnTo = `${origin}/api/steam/callback?state=${encodeURIComponent(state)}`;
  return Response.redirect(buildSteamOpenIdLoginUrl({ realm: `${origin}/`, returnTo }));
}
