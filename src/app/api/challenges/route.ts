import { demoGames } from "@/modules/catalog/domain/game";
import { prototypeServices } from "@/lib/server/services";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { hostName?: string; firstTo?: number; gameIds?: string[] };
    const validIds = new Set(demoGames.map((game) => game.id));
    const gameIds = Array.isArray(body.gameIds) ? body.gameIds.filter((id) => validIds.has(id)) : [];
    const result = prototypeServices().challengeService.create({
      hostName: body.hostName ?? "",
      firstTo: Number(body.firstTo ?? 3),
      gameIds,
    });
    return Response.json({
      challenge: result.challenge,
      hostToken: result.hostToken,
      inviteToken: result.inviteToken,
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create challenge" }, { status: 400 });
  }
}
