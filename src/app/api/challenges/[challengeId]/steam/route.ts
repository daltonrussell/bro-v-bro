import { prototypeServices } from "@/lib/server/services";
import { summarizeSteamChallengeAccess } from "@/modules/integrations/steam/steam-access";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const { challengeService, steamConnections, steamLibrary } = prototypeServices();
  const role = challengeService.resolveViewer(challengeId, token);
  if (role !== "host" && role !== "guest") {
    return Response.json({ error: "Participant token required" }, { status: 401 });
  }

  const access = summarizeSteamChallengeAccess(steamConnections.listForChallenge(challengeId));
  return Response.json({ configured: steamLibrary.configured, ...access });
}
