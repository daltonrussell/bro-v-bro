import { prototypeServices } from "@/lib/server/services";
import type { ChallengeCommand } from "@/modules/challenge/application/challenge-service";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  try {
    const { challengeId } = await context.params;
    const body = await request.json() as { token?: string; command?: ChallengeCommand };
    if (!body.command) throw new Error("Command is required");

    const result = await prototypeServices().challengeService.command({
      challengeId,
      token: body.token ?? "",
      command: body.command,
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update challenge";
    const status = message.includes("refresh") ? 409 : 400;
    return Response.json({ error: message }, { status });
  }
}
