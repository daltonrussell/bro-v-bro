import { prototypeServices } from "@/lib/server/services";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { hostName?: string; firstTo?: number };
    const result = prototypeServices().challengeService.create({
      hostName: body.hostName ?? "",
      firstTo: Number(body.firstTo ?? 3),
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
