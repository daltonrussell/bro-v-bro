import { prototypeServices } from "@/lib/server/services";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const { challenges, sessions } = prototypeServices();
  const playerId = challenges.resolvePlayer(sessionId, token);
  if (!playerId) return Response.json({ error: "Invalid participant token" }, { status: 401 });
  const session = await sessions.getById(sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  return Response.json({ session, playerId });
}
