"use client";

import { useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MineGame } from "./MineGame";
import { WhackAMob } from "./WhackAMob";

const GAMES = [
  { key: "slash", label: "Block Slash" },
  { key: "whack", label: "Whack-a-Mob" },
] as const;
type GameKey = (typeof GAMES)[number]["key"];

// Block Slash stays mounted (just hidden) so its one-time curtain reveal
// doesn't replay every time you switch back; Whack-a-Mob simply unmounts,
// which also abandons a run in progress.
export function Games() {
  const [game, setGame] = useState<GameKey>("slash");

  const pick = (key: GameKey) => {
    setGame(key);
    // The two games differ in height — re-measure scroll-driven sections.
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  return (
    <div id="game" className="scroll-mt-24">
      <div role="tablist" className="mb-5 flex justify-center gap-2">
        {GAMES.map((g) => (
          <button
            key={g.key}
            role="tab"
            aria-selected={game === g.key}
            onClick={() => pick(g.key)}
            className={`font-minecraft border-2 border-black px-4 py-1.5 text-sm shadow-[inset_-2px_-3px_0_rgba(0,0,0,0.45),inset_2px_2px_0_rgba(255,255,255,0.3)] transition-colors sm:text-base ${
              game === g.key ? "bg-grass text-white" : "bg-[#6f6f6f] text-white/70 hover:bg-[#7c86c4] hover:text-white"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className={game === "slash" ? "" : "hidden"}>
        <MineGame />
      </div>
      {game === "whack" && <WhackAMob />}
    </div>
  );
}
