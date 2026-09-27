"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CubeFaces, type BlockFaces } from "./Block3D";
import { MobHeadFaces, VILLAGER_HEAD } from "./MobHead";

gsap.registerPlugin(ScrollTrigger);

type Kind = "ore" | "tnt";
type Block = { id: number; x: number; dur: number; spin: number; kind: Kind; points: number; tex: string };
type Particle = { id: number; x: number; y: number; color: string; dx: number; dy: number };
type Popup = { id: number; x: number; y: number; text: string; color: string };
type Rune = { id: number; x: number; y: number; char: string };
type Difficulty = "easy" | "medium" | "hard";

// Minecraft's enchantment-table text is set in the Standard Galactic
// Alphabet — any of these plain letters, rendered with the SGA font
// (`font-enchant`), reads as one of those glyphs.
const RUNE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Blocks size off the play area's width: ~44px on a phone, 64px max on
// desktop — small enough to leave room to swipe, big enough to tap.
const blockSizeFor = (width: number) => Math.round(Math.min(64, Math.max(36, width / 7.5)));

const uniform = (name: string): BlockFaces => ({
  top: `/images/blocks/${name}.png`,
  side: `/images/blocks/${name}.png`,
  bottom: `/images/blocks/${name}.png`,
});

const TNT_FACES: BlockFaces = {
  top: "/images/blocks/tnt_top.png",
  side: "/images/blocks/tnt_side.png",
  bottom: "/images/blocks/tnt_bottom.png",
};

const ORE_BLOCKS = [
  { tex: "dirt", points: 1, color: "#8a6b4a" },
  { tex: "stone", points: 1, color: "#9a9a9a" },
  { tex: "cobblestone", points: 1, color: "#888888" },
  { tex: "coal_ore", points: 2, color: "#3a3a3a" },
  { tex: "copper_block", points: 2, color: "#c36f4f" },
  { tex: "glowstone", points: 2, color: "#e8c15a" },
  { tex: "iron_ore", points: 3, color: "#cbb193" },
  { tex: "redstone_ore", points: 3, color: "#a8342a" },
  { tex: "lapis_ore", points: 3, color: "#2d5fc4" },
  { tex: "obsidian", points: 3, color: "#4a3d6b" },
  { tex: "sea_lantern", points: 3, color: "#cfe8e0" },
  { tex: "gold_ore", points: 4, color: "#e6c948" },
  { tex: "amethyst_block", points: 4, color: "#9a6fd6" },
  { tex: "diamond_ore", points: 6, color: "#5cd6cd" },
  { tex: "emerald_ore", points: 6, color: "#2fbf6a" },
  { tex: "netherite_block", points: 8, color: "#4a4340" },
];

const DIFFICULTY_CONFIG: Record<Difficulty, { tntChance: number; minDur: number; maxDur: number }> = {
  easy: { tntChance: 0.08, minDur: 2.6, maxDur: 3.6 },
  medium: { tntChance: 0.16, minDur: 1.9, maxDur: 2.8 },
  hard: { tntChance: 0.26, minDur: 1.3, maxDur: 2 },
};

const HINT = "Tap Or Swipe The Blocks · Hit TNT Resets Your Score";

let uid = 0;

function randomBlock(width: number, cfg: (typeof DIFFICULTY_CONFIG)[Difficulty]): Block {
  const x = Math.random() * Math.max(1, width - blockSizeFor(width));
  const dur = cfg.minDur + Math.random() * (cfg.maxDur - cfg.minDur);
  const spin = 3 + Math.random() * 4;
  if (Math.random() < cfg.tntChance) {
    return { id: uid++, x, dur, spin, kind: "tnt", points: 0, tex: "tnt" };
  }
  const ore = ORE_BLOCKS[Math.floor(Math.random() * ORE_BLOCKS.length)];
  return { id: uid++, x, dur, spin, kind: "ore", points: ore.points, tex: ore.tex };
}

function burstColor(tex: string) {
  return ORE_BLOCKS.find((o) => o.tex === tex)?.color ?? "#8a897f";
}

export function MineGame() {
  const gameWrapRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef(new Map<number, HTMLDivElement>());
  const brokenThisStroke = useRef(new Set<number>());
  const dragging = useRef(false);
  const cfgRef = useRef(DIFFICULTY_CONFIG.medium);
  const lastRuneAt = useRef(0);
  const curtainLeftRef = useRef<HTMLDivElement>(null);
  const curtainRightRef = useRef<HTMLDivElement>(null);
  const villagerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [runes, setRunes] = useState<Rune[]>([]);
  const [swordCursor, setSwordCursor] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [blockSize, setBlockSize] = useState(64);
  const modeBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scoreDisplayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      const width = areaRef.current?.clientWidth ?? 300;
      setBlockSize(blockSizeFor(width));
      setBlocks(Array.from({ length: 5 }, () => randomBlock(width, cfgRef.current)));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // The game sits hidden behind a curtain until you actually scroll down
  // to it (it's the last real content on the page) — a villager steps up,
  // tugs it open, and steps back out. One-shot (not scrubbed): a curtain
  // re-closing every time you scroll back up would read as broken, not
  // reversible, so unlike the rest of the site's scroll transitions this
  // one only ever plays forward, once.
  useLayoutEffect(() => {
    const wrap = gameWrapRef.current;
    const left = curtainLeftRef.current;
    const right = curtainRightRef.current;
    const villager = villagerRef.current;
    if (!wrap || !left || !right || !villager) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set([left, right], { autoAlpha: 0 });
      gsap.set(villager, { autoAlpha: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      // Paused, not driven straight by the ScrollTrigger — reaching the
      // bottom only arms a 2.5s delayed call, so there's a beat to notice
      // you've arrived before the villager does anything, rather than the
      // curtain instantly ripping open the moment it enters view.
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(villager, { autoAlpha: 0, y: 40, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(2)" })
        .to(villager, { rotate: -12, duration: 0.15, ease: "power1.out" })
        .to(villager, { rotate: 6, duration: 0.15, ease: "power1.inOut" })
        .to(
          left,
          { xPercent: -100, duration: 0.9, ease: "power2.inOut" },
          "-=0.05",
        )
        .to(right, { xPercent: 100, duration: 0.9, ease: "power2.inOut" }, "<")
        .to(villager, { autoAlpha: 0, x: -60, duration: 0.35, ease: "power1.in" }, "-=0.3");

      ScrollTrigger.create({
        trigger: wrap,
        start: "top 82%",
        once: true,
        onEnter: () => gsap.delayedCall(2.5, () => tl.play()),
      });
    }, wrap);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!scoreDisplayRef.current) return;
    gsap.fromTo(scoreDisplayRef.current, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
  }, [score, best]);

  const resetGame = useCallback((next: Difficulty) => {
    cfgRef.current = DIFFICULTY_CONFIG[next];
    setDifficulty(next);
    setScore(0);
    setParticles([]);
    setPopups([]);
    brokenThisStroke.current.clear();
    const width = areaRef.current?.clientWidth ?? 300;
    setBlockSize(blockSizeFor(width));
    setBlocks(Array.from({ length: 5 }, () => randomBlock(width, DIFFICULTY_CONFIG[next])));
  }, []);

  const handleModeClick = useCallback(
    (level: Difficulty, index: number) => {
      const btn = modeBtnRefs.current[index];
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        if (btn) {
          gsap.fromTo(btn, { scale: 0.82 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
        }
        if (areaRef.current) {
          gsap.fromTo(
            areaRef.current,
            { autoAlpha: 0.25, scale: 0.97 },
            { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power2.out" },
          );
        }
      }
      resetGame(level);
    },
    [resetGame],
  );

  const spawnReplacement = useCallback((id: number) => {
    const width = areaRef.current?.clientWidth ?? 300;
    setBlocks((prev) => prev.map((b) => (b.id === id ? randomBlock(width, cfgRef.current) : b)));
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    const burstId = uid++;
    const fragments: Particle[] = Array.from({ length: 6 }, (_, i) => ({
      id: burstId * 100 + i,
      x,
      y,
      color,
      dx: (Math.random() - 0.5) * 70,
      dy: (Math.random() - 0.5) * 70 - 20,
    }));
    setParticles((prev) => [...prev, ...fragments]);
    window.setTimeout(() => {
      const ids = new Set(fragments.map((f) => f.id));
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, 500);
  }, []);

  const spawnPopup = useCallback((x: number, y: number, text: string, color: string) => {
    const id = uid++;
    setPopups((prev) => [...prev, { id, x, y, text, color }]);
    window.setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 700);
  }, []);

  const onFallComplete = useCallback(
    (block: Block) => {
      // Missed blocks (ore or TNT) just fall away, Fruit-Ninja style — no
      // penalty for letting one go, only for actually hitting TNT.
      spawnReplacement(block.id);
    },
    [spawnReplacement],
  );

  const breakBlock = useCallback(
    (block: Block) => {
      if (brokenThisStroke.current.has(block.id)) return;
      brokenThisStroke.current.add(block.id);

      const el = blockRefs.current.get(block.id);
      const rect = el?.getBoundingClientRect();
      const areaRect = areaRef.current?.getBoundingClientRect();
      const relX = rect && areaRect ? rect.left - areaRect.left + rect.width / 2 : 0;
      const relY = rect && areaRect ? rect.top - areaRect.top + rect.height / 2 : 0;

      if (el) {
        el.getAnimations().forEach((a) => a.cancel());
        gsap.to(el, { scale: 1.5, autoAlpha: 0, duration: 0.22, ease: "power1.out" });
      }

      if (block.kind === "tnt") {
        spawnParticles(relX, relY, "#e0632c");
        if (areaRef.current) {
          gsap.fromTo(areaRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });
        }
        if (flashRef.current) {
          gsap.fromTo(flashRef.current, { autoAlpha: 0.55 }, { autoAlpha: 0, duration: 0.5 });
        }
        spawnPopup(relX, relY, "BOOM!", "#ff6a3d");
        setScore(0);
      } else {
        spawnParticles(relX, relY, burstColor(block.tex));
        spawnPopup(relX, relY, `+${block.points}`, "#f8c723");
        setScore((s) => {
          const next = s + block.points;
          setBest((b) => Math.max(b, next));
          return next;
        });
      }

      window.setTimeout(() => spawnReplacement(block.id), 260);
    },
    [spawnReplacement, spawnParticles, spawnPopup],
  );

  // Padded well past the block's own visual edges — swipes are mostly
  // horizontal motions, so the horizontal pad is generous, making blocks
  // much more forgiving to hit without needing pixel-perfect aim.
  const HIT_PAD_X = 42;
  const HIT_PAD_Y = 24;

  const hitTest = useCallback(
    (clientX: number, clientY: number) => {
      blocks.forEach((block) => {
        const el = blockRefs.current.get(block.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (
          clientX >= rect.left - HIT_PAD_X &&
          clientX <= rect.right + HIT_PAD_X &&
          clientY >= rect.top - HIT_PAD_Y &&
          clientY <= rect.bottom + HIT_PAD_Y
        ) {
          breakBlock(block);
        }
      });
    },
    [blocks, breakBlock],
  );

  // Throttled fairly hard — this fires on every hover move across the
  // whole box (not just while dragging to break blocks), so it's a
  // high-volume source of state updates. Too short an interval here was
  // the main source of the previously reported lag.
  const runeAt = useCallback(
    (clientX: number, clientY: number) => {
      const now = performance.now();
      if (now - lastRuneAt.current < 90) return;
      lastRuneAt.current = now;
      const areaRect = areaRef.current?.getBoundingClientRect();
      if (!areaRect) return;
      const id = uid++;
      const char = RUNE_CHARS[Math.floor(Math.random() * RUNE_CHARS.length)];
      // Capped at 6 concurrent glyphs — a burst of fast mouse movement
      // shouldn't be able to pile up an unbounded number of timed state
      // updates waiting to fire.
      setRunes((prev) => [...prev.slice(-5), { id, x: clientX - areaRect.left, y: clientY - areaRect.top, char }]);
      window.setTimeout(() => {
        setRunes((prev) => prev.filter((r) => r.id !== id));
      }, 550);
    },
    [],
  );

  const moveCursor = useCallback((clientX: number, clientY: number) => {
    const areaRect = areaRef.current?.getBoundingClientRect();
    const cursor = cursorRef.current;
    if (!areaRect || !cursor) return;
    cursor.style.transform = `translate(${clientX - areaRect.left}px, ${clientY - areaRect.top}px) translate(-50%, -80%) rotate(-45deg)`;
  }, []);

  const onPointerDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    brokenThisStroke.current.clear();
    hitTest(e.clientX, e.clientY);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    moveCursor(e.clientX, e.clientY);
    runeAt(e.clientX, e.clientY);
    if (!dragging.current) return;
    hitTest(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    dragging.current = false;
    brokenThisStroke.current.clear();
  };
  const onAreaEnter = (e: ReactPointerEvent) => {
    setSwordCursor(true);
    moveCursor(e.clientX, e.clientY);
  };
  const onAreaLeave = () => {
    setSwordCursor(false);
    onPointerUp();
  };

  return (
    <div ref={gameWrapRef} className="relative w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(["easy", "medium", "hard"] as Difficulty[]).map((level, i) => (
            <button
              key={level}
              ref={(el) => {
                modeBtnRefs.current[i] = el;
              }}
              onClick={() => handleModeClick(level, i)}
              className={`font-pixel px-2.5 py-1 text-[9px] uppercase tracking-widest transition-colors sm:text-[10px] ${
                difficulty === level
                  ? "bg-gold text-panel"
                  : "bg-white/10 text-background/60 hover:bg-white/20"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <span
          ref={scoreDisplayRef}
          className="font-pixel inline-block text-[10px] uppercase tracking-widest text-gold sm:text-[11px]"
        >
          Score {String(score).padStart(3, "0")} &middot; Best {String(best).padStart(3, "0")}
        </span>
      </div>

      <p className="font-hand mb-2 text-center text-sm text-background/50">{HINT}</p>

      <div
        ref={areaRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerEnter={onAreaEnter}
        onPointerLeave={onAreaLeave}
        className={`relative h-[60vh] min-h-[420px] w-full touch-none select-none overflow-hidden [container-type:size] sm:h-[70vh] sm:min-h-[560px] ${swordCursor ? "cursor-none" : ""}`}
      >
        <div ref={flashRef} className="pointer-events-none absolute inset-0 z-20 bg-lava opacity-0" />

        {runes.map((r) => (
          <span
            key={r.id}
            className="font-enchant pointer-events-none absolute z-30 text-2xl text-gold drop-shadow-[0_0_5px_rgba(248,199,35,0.9)]"
            style={{
              left: r.x,
              top: r.y,
              animation: "trail-fade 0.55s ease-out forwards",
            }}
          >
            {r.char}
          </span>
        ))}

        {swordCursor && (
          <div
            ref={cursorRef}
            className="pointer-events-none absolute left-0 top-0 z-40 h-10 w-10 will-change-transform"
            style={{
              backgroundImage: "url(/images/crafted/diamond_sword.png)",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              imageRendering: "pixelated",
              filter:
                "drop-shadow(0 0 4px rgba(255,236,150,0.95)) drop-shadow(0 0 9px rgba(190,120,255,0.75))",
              animation: "enchant-glow 1.1s ease-in-out infinite",
            }}
          />
        )}

        {blocks.map((b, i) => (
          <div
            key={b.id}
            ref={(el) => {
              if (el) blockRefs.current.set(b.id, el);
              else blockRefs.current.delete(b.id);
            }}
            onAnimationEnd={() => onFallComplete(b)}
            className="absolute"
            style={
              reducedMotion
                ? { left: b.x, top: 20 + i * (blockSize + 8), width: blockSize, height: blockSize }
                : {
                    left: b.x,
                    top: 0,
                    // Resting spot below the area, so a block whose animation
                    // is cancelled on break stays out of view while it fades.
                    translate: "0 105cqh",
                    width: blockSize,
                    height: blockSize,
                    animationName: "launch, wobble",
                    animationDuration: `${b.dur}s, 1.4s`,
                    animationTimingFunction: "linear, ease-in-out",
                    animationIterationCount: "1, infinite",
                    animationFillMode: "forwards, none",
                  }
            }
          >
            <div className="h-full w-full [perspective:400px]">
              <div
                className="relative h-full w-full [transform-style:preserve-3d]"
                style={
                  reducedMotion
                    ? undefined
                    : { animation: `spin-slow ${b.spin}s linear infinite`, willChange: "transform" }
                }
              >
                <CubeFaces size={blockSize} faces={b.kind === "tnt" ? TNT_FACES : uniform(b.tex)} />
              </div>
            </div>
          </div>
        ))}

        {particles.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none absolute h-1.5 w-1.5"
            style={
              {
                left: p.x,
                top: p.y,
                background: p.color,
                animation: "particle-burst 0.5s ease-out forwards",
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
              } as CSSProperties
            }
          />
        ))}

        {popups.map((p) => (
          <span
            key={p.id}
            className="font-display pointer-events-none absolute text-lg"
            style={{ left: p.x, top: p.y, color: p.color, animation: "popup-rise 0.7s ease-out forwards" }}
          >
            {p.text}
          </span>
        ))}
      </div>

      {/* Hides the entire game (buttons, hint, play area) behind a drawn
          curtain until you actually scroll down to it — the villager tugs
          it open once, then the curtain stays open for good. */}
      {/* The wrapper itself never blocks clicks (the villager inside it
          shouldn't either), but each curtain panel does — otherwise the
          game underneath is fully clickable through the "closed" curtain,
          which is exactly backwards. Once a panel's own translateX slides
          it off to the side, it no longer overlaps the game area, so this
          same `pointer-events-auto` stops blocking anything on its own. */}
      <div className="pointer-events-none absolute inset-0 z-50 flex">
        <div
          ref={curtainLeftRef}
          className="pointer-events-auto h-full w-1/2 border-r-2 border-black/30"
          style={{
            background:
              "repeating-linear-gradient(90deg, #7a1f1f 0px, #7a1f1f 22px, #611515 22px, #611515 44px)",
            boxShadow: "inset -12px 0 24px rgba(0,0,0,0.4)",
          }}
        />
        <div
          ref={curtainRightRef}
          className="pointer-events-auto h-full w-1/2 border-l-2 border-black/30"
          style={{
            background:
              "repeating-linear-gradient(90deg, #7a1f1f 0px, #7a1f1f 22px, #611515 22px, #611515 44px)",
            boxShadow: "inset 12px 0 24px rgba(0,0,0,0.4)",
          }}
        />
        <div
          ref={villagerRef}
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 [perspective:400px]"
        >
          <div
            className="relative h-full w-full [transform-style:preserve-3d]"
            style={{ transform: "rotateX(-12deg) rotateY(25deg)" }}
          >
            <MobHeadFaces size={64} spec={VILLAGER_HEAD} />
          </div>
        </div>
      </div>
    </div>
  );
}
