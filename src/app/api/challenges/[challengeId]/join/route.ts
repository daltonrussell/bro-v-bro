import { prototypeServices } from "@/lib/server/services";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  try {
    const { challengeId } = await context.params;
    const body = await request.json() as { inviteToken?: string; opponentName?: string };
    const result = await prototypeServices().challengeService.join({
      challengeId,
      inviteToken: body.inviteToken ?? "",
      opponentName: body.opponentName ?? "",
    });
    return Response.json({
      sessionId: result.session.id,
      participantToken: result.opponentToken,
      playerId: "player-b",
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to join challenge" }, { status: 400 });
  }
}
