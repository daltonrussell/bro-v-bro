import { prototypeServices } from "@/lib/server/services";
import { demoGames } from "@/modules/catalog/domain/game";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const { challenges, sessions } = prototypeServices();
  if (!challenges.resolvePlayer(sessionId, token)) return new Response("Unauthorized", { status: 401 });
  const session = await sessions.getById(sessionId);
  if (!session) return new Response("Not found", { status: 404 });
  if (session.status !== "completed") return new Response("Match is not complete", { status: 409 });

  const width = 1200;
  const rowHeight = 72;
  const top = 350;
  const height = top + Math.max(1, session.rounds.length) * rowHeight + 120;
  const playerA = escapeXml(session.players[0].displayName);
  const playerB = escapeXml(session.players[1].displayName);
  const winner = escapeXml(session.players.find((player) => player.id === session.winnerId)?.displayName ?? "Winner");

  const rows = session.rounds.map((round, index) => {
    const game = demoGames.find((candidate) => candidate.id === round.gameId);
    const y = top + index * rowHeight;
    const name = escapeXml(game?.name ?? round.gameId);
    const short = escapeXml(game?.shortName ?? "?");
    const accent = game?.accent ?? "#8d82ff";
    const aWin = round.winnerId === "player-a";
    const bWin = round.winnerId === "player-b";
    return `
      <line x1="70" y1="${y}" x2="1130" y2="${y}" stroke="#11131a" stroke-opacity="0.12" />
      <text x="105" y="${y + 44}" font-size="28" font-weight="900" fill="${aWin ? "#11131a" : "#11131a26"}">${aWin ? "✓" : "—"}</text>
      <circle cx="600" cy="${y + 34}" r="24" fill="${accent}" />
      <text x="600" y="${y + 41}" text-anchor="middle" font-size="15" font-weight="900" fill="#11131a">${short}</text>
      <text x="640" y="${y + 43}" font-size="21" font-weight="800" fill="#11131a">${name}</text>
      <text x="1095" y="${y + 44}" text-anchor="end" font-size="28" font-weight="900" fill="${bWin ? "#11131a" : "#11131a26"}">${bWin ? "✓" : "—"}</text>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#0e1016" />
    <rect x="34" y="34" width="1132" height="${height - 68}" rx="34" fill="#e9e3d8" />
    <rect x="46" y="46" width="1132" height="${height - 68}" rx="34" fill="none" stroke="#8d82ff" stroke-width="8" />
    <text x="70" y="88" font-family="Arial, sans-serif" font-size="17" font-weight="900" letter-spacing="4" fill="#6c5ce7">BRO / V / BRO · FINAL</text>
    <text x="70" y="174" font-family="Arial, sans-serif" font-size="48" font-weight="900" fill="#11131a">${playerA}</text>
    <text x="1130" y="174" text-anchor="end" font-family="Arial, sans-serif" font-size="48" font-weight="900" fill="#11131a">${playerB}</text>
    <text x="600" y="186" text-anchor="middle" font-family="Arial, sans-serif" font-size="86" font-weight="900" letter-spacing="-5" fill="#11131a">${session.score["player-a"]}–${session.score["player-b"]}</text>
    <line x1="70" y1="220" x2="1130" y2="220" stroke="#11131a" stroke-width="3" />
    <text x="600" y="264" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="900" letter-spacing="4" fill="#11131a88">SERIES WINNER</text>
    <text x="600" y="318" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="900" fill="#6c5ce7">${winner}</text>
    <g font-family="Arial, sans-serif">${rows}</g>
    <text x="600" y="${height - 52}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="900" letter-spacing="3" fill="#11131a66">LOSER PICKS NEXT · UNTIL THEY CAN'T</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "private, no-store",
      "content-disposition": `inline; filename="bro-v-bro-${session.id}.svg"`,
    },
  });
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);
}
