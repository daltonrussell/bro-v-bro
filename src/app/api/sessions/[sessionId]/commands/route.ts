import { randomUUID } from "node:crypto";
import { prototypeServices } from "@/lib/server/services";
import { executeSessionCommand } from "@/modules/gauntlet/application/execute-command";
import type { SessionCommand } from "@/modules/gauntlet/application/commands";
import { GauntletRuleError } from "@/modules/gauntlet/domain/session";
import { OptimisticConcurrencyError } from "@/modules/gauntlet/application/session-repository";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const body = await request.json() as {
      token?: string;
      expectedVersion?: number;
      idempotencyKey?: string;
      command?: SessionCommand;
    };
    const { challenges, sessions } = prototypeServices();
    const actorId = challenges.resolvePlayer(sessionId, body.token ?? "");
    if (!actorId) return Response.json({ error: "Invalid participant token" }, { status: 401 });
    if (!body.command || typeof body.expectedVersion !== "number") {
      return Response.json({ error: "command and expectedVersion are required" }, { status: 400 });
    }
    const session = await executeSessionCommand({
      repository: sessions,
      envelope: {
        sessionId,
        actorId,
        expectedVersion: body.expectedVersion,
        idempotencyKey: body.idempotencyKey || randomUUID(),
        command: body.command,
      },
    });
    return Response.json({ session, playerId: actorId });
  } catch (error) {
    const status = error instanceof OptimisticConcurrencyError || (error instanceof Error && error.message.startsWith("Stale session version")) ? 409 : 400;
    return Response.json({
      error: error instanceof GauntletRuleError || error instanceof Error ? error.message : "Command failed",
    }, { status });
  }
}
