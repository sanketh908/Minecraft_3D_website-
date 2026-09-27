"use client";

import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { CubeFaces, type BlockFaces } from "./Block3D";
import {
  MobHeadFaces,
  ZOMBIE_HEAD,
  SKELETON_HEAD,
  CREEPER_HEAD,
  PIGLIN_HEAD,
  type MobHeadSpec,
} from "./MobHead";

type Kind = "mob" | "tnt" | "clock";
type Bit = { dx: number; dy: number };
type Hole = { id: number; kind: Kind; mob: number; up: boolean; hit: boolean; sparks: Bit[] } | null;
type Popup = { id: number; cell: number; text: string; color: string };
type Phase = "idle" | "playing" | "over";

const GAME_SECONDS = 30;
const CLOCK_BONUS = 5;
const TNT_CHANCE = 0.2;
const CLOCK_CHANCE = 0.08;

// Rarer / tougher mobs are worth more.
const MOBS: { spec: MobHeadSpec; points: number; name: string }[] = [
  { spec: ZOMBIE_HEAD, points: 1, name: "zombie" },
  { spec: SKELETON_HEAD, points: 1, name: "skeleton" },
  { spec: CREEPER_HEAD, points: 2, name: "creeper" },
  { spec: PIGLIN_HEAD, points: 3, name: "piglin" },
];

const TNT_FACES: BlockFaces = {
  top: "/images/blocks/tnt_top.png",
  side: "/images/blocks/tnt_side.png",
  bottom: "/images/blocks/tnt_bottom.png",
};

// ---- Board geometry -------------------------------------------------------
// Each hole is Minecraft's chest model (14×10×14 body, 14×5×14 lid on a back
// hinge, 2×4×1 latch — in 1/16-block units) tilted toward the viewer by
// TILT. Whatever pops out is clipped to the chest opening's front lip *in
// screen space*, so it reads as climbing out of the chest and never shows
// outside it. proj() projects a model point (y down, z toward the viewer,
// 1/16 units) to a screen-y offset from the chest's center, as a fraction
// of the block size (near-orthographic: very long perspective).
const TILT = 28;
const COS = Math.cos((TILT * Math.PI) / 180);
const SIN = Math.sin((TILT * Math.PI) / 180);
const proj = (y: number, z: number) => (y * COS + z * SIN) / 16;
const LID_OPEN = 75; // degrees
const PIT_FRONT = proj(-2, 7); // front lip of the opening
const PIT_MID = proj(-2, 0); // middle of the opening
const PIT_HALF_WIDTH = 7 / 16;
const BOTTOM_EDGE = proj(8, 7);
const TOP_EXTENT = 1.2; // the open lid reaches ~this far above center
const HEAD = 0.56; // head size, fraction of the block
const ROW_OVERLAP = 0.55; // rows tuck into the headroom of the row behind

// Minecraft's chest texture is stored upside down (the model is rotated
// 180° in-game), so every piece is drawn with rotateZ(180deg) — that puts
// the real outer lid, wood sides and dark interior on the right faces.
const CHEST_SRC = "/images/blocks/chest.png";
const chestPart = (box: { w: number; h: number; d: number }, uv: { x: number; y: number }): MobHeadSpec => ({
  src: CHEST_SRC,
  sheetW: 64,
  sheetH: 64,
  fallback: "#5c3d1e",
  boxes: [{ box, uv }],
});
const CHEST_BODY = chestPart({ w: 14, h: 10, d: 14 }, { x: 0, y: 19 });
const CHEST_LID = chestPart({ w: 14, h: 5, d: 14 }, { x: 0, y: 0 });
const CHEST_LATCH = chestPart({ w: 2, h: 4, d: 1 }, { x: 0, y: 0 });

const MC_BUTTON =
  "font-minecraft border-2 border-black bg-[#6f6f6f] px-8 py-2 text-lg text-white shadow-[inset_-2px_-3px_0_rgba(0,0,0,0.45),inset_2px_2px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-[#7c86c4]";

let uid = 0;

function sparkBurst(): Bit[] {
  return Array.from({ length: 6 }, (_, i) => ({
    dx: (i / 5 - 0.5) * 1.1 + (Math.random() - 0.5) * 0.2,
    dy: -0.25 - Math.random() * 0.35,
  }));
}

function ChestPiece({ spec, size, x, y, z }: { spec: MobHeadSpec; size: number; x: number; y: number; z: number }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]"
      style={{ transform: `translate3d(${x}px, ${y}px, ${z}px) rotateZ(180deg)` }}
    >
      <MobHeadFaces size={size} spec={spec} />
    </div>
  );
}

const Chest = memo(function Chest({ size, open }: { size: number; open: boolean }) {
  const u = size / 16;
  return (
    <div className="[perspective:1600px]" style={{ width: size, height: size }}>
      <div
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${-TILT}deg)` }}
      >
        <ChestPiece spec={CHEST_BODY} size={14 * u} x={0} y={3 * u} z={0} />
        {/* Lid + latch swing on the back hinge. */}
        <div
          className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]"
          style={{
            transform: `translate3d(0, ${-2 * u}px, ${-7 * u}px) rotateX(${open ? LID_OPEN : 0}deg)`,
            transition: open
              ? "transform 160ms cubic-bezier(0.2, 0.9, 0.3, 1.2)"
              : "transform 220ms cubic-bezier(0.6, 0, 0.9, 0.6) 120ms",
          }}
        >
          <ChestPiece spec={CHEST_LID} size={14 * u} x={0} y={-2.5 * u} z={7 * u} />
          <ChestPiece spec={CHEST_LATCH} size={4 * u} x={0} y={u} z={14.5 * u} />
        </div>
      </div>
    </div>
  );
});

export function WhackAMob() {
  const boardRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const holesRef = useRef<Hole[]>(Array(9).fill(null));
  const timers = useRef<number[]>([]);
  const deadline = useRef(0);

  const [holes, setHoles] = useState<Hole[]>(() => Array(9).fill(null));
  const [popups, setPopups] = useState<Popup[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [endReason, setEndReason] = useState<"time" | "tnt">("time");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [cellW, setCellW] = useState(120);

  // Everything is sized off the real cell width, so the board looks the
  // same on a phone as on a monitor.
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const ro = new ResizeObserver(() => {
      if (board.clientWidth) setCellW(board.clientWidth / 3);
    });
    ro.observe(board);
    return () => ro.disconnect();
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const update = (fn: (prev: Hole[]) => Hole[]) => {
    holesRef.current = fn(holesRef.current);
    setHoles(holesRef.current);
  };
  const setHole = (i: number, id: number, fn: (h: NonNullable<Hole>) => Hole) =>
    update((prev) => prev.map((h, j) => (j === i && h?.id === id ? fn(h) : h)));

  const retract = useCallback((i: number, id: number) => {
    setHole(i, id, (h) => ({ ...h, up: false }));
    later(() => setHole(i, id, () => null), 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const end = useCallback((reason: "time" | "tnt") => {
    clearTimers();
    setEndReason(reason);
    setPhase("over");
    update((prev) => prev.map((h) => (h ? { ...h, up: false } : h)));
  }, []);

  const start = () => {
    clearTimers();
    update(() => Array(9).fill(null));
    setPopups([]);
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    deadline.current = performance.now() + GAME_SECONDS * 1000;
    setPhase("playing");
  };

  // Countdown against a deadline, so a clock pickup can push it back.
  useEffect(() => {
    if (phase !== "playing") return;
    const iv = window.setInterval(() => {
      const left = Math.max(0, (deadline.current - performance.now()) / 1000);
      setTimeLeft(left);
      if (left <= 0) end("time");
    }, 100);
    return () => clearInterval(iv);
  }, [phase, end]);

  // Spawner — things pop up faster and stay up for less time the longer
  // the run goes on.
  useEffect(() => {
    if (phase !== "playing") return;
    const t0 = performance.now();
    let timer = 0;
    const tick = () => {
      const pace = 1 - Math.min(1, (performance.now() - t0) / 1000 / 40); // 1 → 0
      const empty = holesRef.current.flatMap((h, i) => (h ? [] : [i]));
      if (empty.length) {
        const i = empty[Math.floor(Math.random() * empty.length)];
        const id = uid++;
        const r = Math.random();
        const hasClock = holesRef.current.some((h) => h?.kind === "clock");
        const kind: Kind = r < TNT_CHANCE ? "tnt" : r < TNT_CHANCE + CLOCK_CHANCE && !hasClock ? "clock" : "mob";
        const mob = Math.floor(Math.random() * MOBS.length);
        update((prev) =>
          prev.map((h, j) => (j === i ? { id, kind, mob, up: false, hit: false, sparks: sparkBurst() } : h)),
        );
        // Mount below the lip first, then rise next frame so it animates.
        requestAnimationFrame(() => requestAnimationFrame(() => setHole(i, id, (h) => ({ ...h, up: true }))));
        later(() => retract(i, id), (kind === "clock" ? 550 : 700) + 650 * pace);
      }
      timer = window.setTimeout(tick, 320 + 480 * pace);
    };
    timer = window.setTimeout(tick, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, retract]);

  const popup = (cell: number, text: string, color: string) => {
    const id = uid++;
    setPopups((prev) => [...prev, { id, cell, text, color }]);
    window.setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== id)), 700);
  };

  const hit = (i: number) => {
    const h = holesRef.current[i];
    if (phase !== "playing" || !h || !h.up || h.hit) return;
    setHole(i, h.id, (x) => ({ ...x, hit: true }));

    if (h.kind === "tnt") {
      popup(i, "BOOM!", "#ff6a3d");
      if (boardRef.current) gsap.fromTo(boardRef.current, { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      if (flashRef.current) gsap.fromTo(flashRef.current, { autoAlpha: 0.6 }, { autoAlpha: 0, duration: 0.7 });
      end("tnt");
      return;
    }
    if (h.kind === "clock") {
      deadline.current += CLOCK_BONUS * 1000;
      popup(i, `+${CLOCK_BONUS}s`, "#80ff20");
    } else {
      const { points } = MOBS[h.mob];
      popup(i, `+${points}`, "#f8c723");
      setScore((s) => {
        const next = s + points;
        setBest((b) => Math.max(b, next));
        return next;
      });
    }
    later(() => retract(i, h.id), 160);
  };

  // Cell geometry in px (see the board-geometry notes above).
  const S = Math.round(cellW * 0.7); // block size
  const headS = Math.round(S * HEAD);
  const cy = S * (TOP_EXTENT + 0.05); // chest center, from the cell's top
  const cellH = cy + S * (BOTTOM_EDGE + 0.14);
  const lipY = cy + S * PIT_FRONT; // everything is clipped to this line
  const restBottom = S * (PIT_FRONT - PIT_MID); // head's bottom sits mid-hole
  const hudTime = Math.ceil(timeLeft);

  return (
    <div className="relative mx-auto w-full max-w-[34rem]">
      {/* HUD */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-pixel text-[10px] uppercase tracking-widest text-gold sm:text-[11px]">
          Score {String(score).padStart(3, "0")} &middot; Best {String(best).padStart(3, "0")}
        </span>
        <span className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/crafted/clock.png" alt="" className="h-5 w-5 [image-rendering:pixelated]" />
          <span
            className={`font-minecraft text-lg leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.8)] ${
              phase === "playing" && hudTime <= 5 ? "text-[#ff6a55]" : "text-[#80ff20]"
            }`}
          >
            {hudTime}
          </span>
        </span>
      </div>
      {/* Timer as a Minecraft XP bar. */}
      <div className="h-1.5 w-full bg-white/10">
        <div
          className="h-full bg-[#80ff20] shadow-[0_0_10px_rgba(128,255,32,0.6)] transition-[width] duration-100 ease-linear"
          style={{ width: `${Math.min(1, timeLeft / GAME_SECONDS) * 100}%` }}
        />
      </div>
      <p className="font-hand mb-4 mt-3 text-center text-sm text-background/50">
        Whack The Mobs &middot; Grab Clocks For Time &middot; Never Hit The TNT
      </p>

      <div
        className="relative"
        style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(106,164,55,0.16), transparent 70%)" }}
      >
        <div ref={boardRef} className="grid touch-manipulation select-none grid-cols-3">
          {holes.map((h, i) => (
            <button
              key={i}
              type="button"
              aria-label={h?.up ? (h.kind === "mob" ? MOBS[h.mob].name : h.kind) : "Empty hole"}
              onPointerDown={() => hit(i)}
              // Rows overlap into the empty headroom above each block; the
              // button itself ignores pointers so only a block (or whatever is
              // popping out of it) takes a tap — never the gap over the row behind.
              className="group pointer-events-none relative outline-none"
              style={{ height: cellH, marginTop: i >= 3 ? -S * ROW_OVERLAP : 0 }}
            >
              {/* Soft contact shadow on the footer. */}
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-black/45 blur-md"
                style={{ top: cy + S * (BOTTOM_EDGE - 0.12), width: S * 0.95, height: S * 0.2 }}
              />
              <div
                className="pointer-events-auto absolute left-1/2 transition-transform duration-200 ease-out group-hover:-translate-y-1"
                style={{ top: cy - S / 2, marginLeft: -S / 2 }}
              >
                <Chest size={S} open={!!h} />
              </div>

              {/* Pop-out window: the hole's width, ending at its front lip. */}
              <div
                className={`absolute top-0 overflow-hidden ${h?.up ? "pointer-events-auto" : ""}`}
                style={{ left: cellW / 2 - S * PIT_HALF_WIDTH, width: S * PIT_HALF_WIDTH * 2, height: lipY }}
              >
                {h && (
                  <div
                    className="absolute left-1/2"
                    style={{
                      bottom: restBottom,
                      marginLeft: -headS / 2,
                      width: headS,
                      height: headS,
                      transform: h.up
                        ? h.hit
                          ? "translateY(8%) scale(1.1, 0.8)"
                          : "translateY(0)"
                        : `translateY(${headS + restBottom + 4}px)`,
                      transition: h.up
                        ? "transform 280ms cubic-bezier(0.34, 1.7, 0.64, 1)"
                        : "transform 170ms cubic-bezier(0.5, 0, 0.9, 0.5)",
                      transformOrigin: "50% 100%",
                    }}
                  >
                    <Popper h={h} size={headS} />
                  </div>
                )}
              </div>

              {/* Loot sparkle as something climbs out. */}
              {h?.up &&
                h.sparks.map((d, k) => (
                  <span
                    key={`${h.id}-${k}`}
                    className="pointer-events-none absolute"
                    style={
                      {
                        left: cellW / 2,
                        top: lipY,
                        width: Math.max(3, S * 0.06),
                        height: Math.max(3, S * 0.06),
                        background: k % 2 ? "#f8c723" : "#fff3b0",
                        boxShadow: "0 0 6px rgba(248,199,35,0.8)",
                        animation: "particle-burst 0.45s ease-out forwards",
                        "--dx": `${d.dx * S}px`,
                        "--dy": `${d.dy * S}px`,
                      } as CSSProperties
                    }
                  />
                ))}

              {popups
                .filter((p) => p.cell === i)
                .map((p) => (
                  <span
                    key={p.id}
                    className="font-display pointer-events-none absolute left-1/2 -translate-x-1/2 text-xl sm:text-2xl"
                    style={{
                      top: cy - S * 1.05,
                      color: p.color,
                      animation: "popup-rise 0.7s ease-out forwards",
                      textShadow: "0 2px 0 #000",
                    }}
                  >
                    {p.text}
                  </span>
                ))}
            </button>
          ))}
        </div>

        <div ref={flashRef} className="pointer-events-none absolute inset-0 bg-lava opacity-0 mix-blend-screen" />

        {phase !== "playing" && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center backdrop-blur-[3px] ${
              phase === "over" && endReason === "tnt" ? "bg-[#5a0000]/55" : "bg-panel/55"
            }`}
          >
            {phase === "idle" ? (
              <>
                <p className="font-pixel text-[10px] uppercase tracking-widest text-gold">Mini Game</p>
                <p className="font-minecraft text-3xl text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.8)] sm:text-4xl">
                  Whack-a-Mob
                </p>
                <p className="font-hand max-w-xs text-lg text-background/80">
                  {GAME_SECONDS} seconds on the clock. Hit every mob that pops up &mdash; but never the TNT.
                </p>
                <button type="button" onClick={start} className={`${MC_BUTTON} mt-2`}>
                  Start
                </button>
              </>
            ) : endReason === "tnt" ? (
              <>
                <p className="font-minecraft text-4xl text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.8)] sm:text-5xl">
                  You Died!
                </p>
                <p className="font-minecraft text-base text-white/90">Player was blown up by TNT</p>
                <p className="font-minecraft text-base text-white">
                  Score: <span className="text-gold">{score}</span>
                </p>
                <button type="button" onClick={start} className={`${MC_BUTTON} mt-2`}>
                  Respawn
                </button>
              </>
            ) : (
              <>
                <p className="font-pixel text-[10px] uppercase tracking-widest text-[#80ff20]">Time&apos;s Up</p>
                <p className="font-display text-7xl leading-none text-gold drop-shadow-[0_4px_0_rgba(0,0,0,0.6)]">
                  {score}
                </p>
                <p className="font-pixel text-[10px] uppercase tracking-widest text-background/60">
                  {score > 0 && score >= best ? "New Best!" : `Best ${best}`}
                </p>
                <button type="button" onClick={start} className={`${MC_BUTTON} mt-2`}>
                  Play Again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Popper({ h, size }: { h: NonNullable<Hole>; size: number }) {
  if (h.kind === "clock") {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ animation: "mob-bob 1s ease-in-out infinite" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/crafted/clock.png"
          alt=""
          className="h-[85%] w-[85%] [image-rendering:pixelated]"
          style={{ filter: "drop-shadow(0 0 6px rgba(255,220,90,0.9))" }}
        />
      </div>
    );
  }
  return (
    <div
      className="relative h-full w-full [perspective:500px]"
      style={{
        // Minecraft's red damage flash.
        filter: h.hit ? "sepia(1) saturate(8) hue-rotate(-40deg) brightness(0.9)" : undefined,
      }}
    >
      <div
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${-TILT / 2}deg)` }}
      >
        {h.kind === "tnt" ? (
          <CubeFaces size={size} faces={TNT_FACES} />
        ) : (
          <MobHeadFaces size={size} spec={MOBS[h.mob].spec} />
        )}
      </div>
    </div>
  );
}
