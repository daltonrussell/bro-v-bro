import { prototypeServices } from "@/lib/server/services";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const { challenges, challengeService } = prototypeServices();
  const challenge = challenges.get(challengeId);
  if (!challenge) return Response.json({ error: "Challenge not found" }, { status: 404 });

  const viewerRole = token ? challengeService.resolveViewer(challengeId, token) : null;
  if (!viewerRole) return Response.json({ error: "Invalid challenge token" }, { status: 401 });

  return Response.json({ challenge, viewerRole });
}
