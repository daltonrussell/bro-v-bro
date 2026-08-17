import type { Game } from "@/modules/catalog/domain/game";

export function GameBadge({ game, size = "md" }: { game: Game; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-16 w-16 text-lg" : size === "sm" ? "h-9 w-9 text-[10px]" : "h-12 w-12 text-xs";
  return (
    <div
      className={`${dimensions} grid shrink-0 place-items-center rounded-[14px] border border-black/20 font-black tracking-tight text-[#11131a] shadow-[2px_2px_0_#11131a]`}
      style={{ backgroundColor: game.accent }}
      aria-label={`${game.name} logo placeholder`}
    >
      {game.shortName}
    </div>
  );
}
