"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useProgress } from "@react-three/drei";
import { lockScroll } from "./SmoothScroll";
import { GRASS_FACES, type BlockFaces } from "./Block3D";
import { FloatingCube } from "./FloatingCube";
import { COW_HEAD, WOLF_HEAD, VILLAGER_HEAD, CREEPER_HEAD, ZOMBIE_HEAD, SKELETON_HEAD, type MobHeadSpec } from "./MobHead";

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

const OAK_LOG_FACES: BlockFaces = {
  top: "/images/blocks/oak_log_top.png",
  side: "/images/blocks/oak_log.png",
  bottom: "/images/blocks/oak_log_top.png",
};

const CRAFTING_TABLE_FACES: BlockFaces = {
  top: "/images/blocks/crafting_table_top.png",
  side: "/images/blocks/crafting_table_front.png",
  bottom: "/images/blocks/oak_planks.png",
};

const MELON_FACES: BlockFaces = {
  top: "/images/blocks/melon_top.png",
  side: "/images/blocks/melon_side.png",
  bottom: "/images/blocks/melon_top.png",
};

const PUMPKIN_FACES: BlockFaces = {
  top: "/images/blocks/pumpkin_top.png",
  side: "/images/blocks/pumpkin_side.png",
  bottom: "/images/blocks/pumpkin_top.png",
};

type CubeConfig = { faces?: BlockFaces; mobHead?: MobHeadSpec };

// Seven fixed screen slots, reused by every phase so a new set of blocks
// always pops into the same places the last set just vacated.
const SLOTS: { top: string; left: string; size: number; spinDuration: number; reverse?: boolean }[] = [
  { top: "16%", left: "12%", size: 40, spinDuration: 5.5 },
  { top: "22%", left: "84%", size: 34, spinDuration: 6, reverse: true },
  { top: "72%", left: "86%", size: 40, spinDuration: 5 },
  { top: "84%", left: "38%", size: 32, spinDuration: 6.5, reverse: true },
  { top: "40%", left: "6%", size: 40, spinDuration: 7 },
  { top: "12%", left: "64%", size: 44, spinDuration: 6.4, reverse: true },
  { top: "88%", left: "64%", size: 34, spinDuration: 5.8 },
];

// Deterministic — no Math.random at render time, so server/client markup
// always matches (see the Preloader hydration fix below).
const PHASES: CubeConfig[][] = [
  [
    { faces: GRASS_FACES },
    { faces: uniform("stone") },
    { faces: OAK_LOG_FACES },
    { faces: uniform("oak_planks") },
    { faces: uniform("bookshelf") },
    { mobHead: ZOMBIE_HEAD },
    { faces: uniform("dirt") },
  ],
  [
    { faces: uniform("coal_ore") },
    { faces: uniform("iron_ore") },
    { faces: uniform("gold_ore") },
    { faces: uniform("diamond_ore") },
    { faces: uniform("emerald_ore") },
    { mobHead: COW_HEAD },
    { faces: TNT_FACES },
  ],
  [
    { faces: uniform("glowstone") },
    { faces: CRAFTING_TABLE_FACES },
    { faces: MELON_FACES },
    { faces: PUMPKIN_FACES },
    { mobHead: WOLF_HEAD },
    { mobHead: VILLAGER_HEAD },
    { faces: uniform("obsidian") },
  ],
  [
    { faces: uniform("deepslate") },
    { faces: uniform("copper_block") },
    { faces: uniform("amethyst_block") },
    { faces: uniform("mud_bricks") },
    { mobHead: SKELETON_HEAD },
    { mobHead: CREEPER_HEAD },
    { faces: uniform("copper_bulb") },
  ],
];

// Upper bound on how long the loading screen waits for assets — a slow
// connection still gets the page, it just finishes loading behind it.
const MAX_WAIT_MS = 15000;

// Loads everything the page will need while the loading screen covers it:
// every <img> (switched from lazy to eager, so the browser still picks the
// right srcset size), every inline background-image texture, the fonts,
// and the boss models (three.js loaders report through drei's useProgress).
function preloadAssets(onProgress: (fraction: number) => void): Promise<void> {
  const imgs = Array.from(document.images);
  imgs.forEach((img) => {
    img.loading = "eager";
  });
  const bgUrls = new Set<string>();
  document.querySelectorAll<HTMLElement>('[style*="url("]').forEach((el) => {
    for (const m of el.style.backgroundImage.matchAll(/url\("?([^")]+)"?\)/g)) bgUrls.add(m[1]);
  });

  const models = new Promise<void>((resolve) => {
    const check = ({ active, total }: { active: boolean; total: number }) => {
      if (total > 0 && !active) {
        unsub();
        resolve();
      }
    };
    const unsub = useProgress.subscribe(check);
    check(useProgress.getState());
  });

  const tasks: Promise<unknown>[] = [
    ...imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((r) => {
            img.addEventListener("load", r, { once: true });
            img.addEventListener("error", r, { once: true });
          }),
    ),
    ...[...bgUrls].map((url) => {
      const img = new Image();
      img.src = url;
      return img.decode().catch(() => {});
    }),
    document.fonts.ready,
    models,
  ];
  let done = 0;
  tasks.forEach((t) => t.then(() => onProgress(++done / tasks.length)));
  return Promise.all(tasks).then(() => {});
}

const PHASE_DURATION = 1.05;
const TOTAL_DURATION = PHASE_DURATION * PHASES.length;

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      lockScroll(false);
      const raf = requestAnimationFrame(() => setDone(true));
      return () => cancelAnimationFrame(raf);
    }

    lockScroll(true);
    // Undo any scroll that landed before the lock (the intro starts at the top).
    if (!location.hash) window.scrollTo(0, 0);

    // The bar shows whichever is further behind: the block-phase animation
    // or the real asset loading. The screen lifts once both are done.
    const obj = { v: 0 };
    let assetPct = 0;
    let finished = false;
    const render = () => {
      const v = Math.min(obj.v, assetPct);
      setProgress(Math.round(v));
      const p = Math.min(PHASES.length - 1, Math.floor((obj.v / 100) * PHASES.length));
      setPhase((prev) => (prev === p ? prev : p));
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      setProgress(100);
      gsap.to(overlayRef.current, {
        autoAlpha: 0,
        duration: 0.5,
        delay: 0.15,
        onComplete: () => {
          lockScroll(false);
          setDone(true);
          // Layout may have settled while covered — re-measure scroll triggers.
          ScrollTrigger.refresh();
        },
      });
    };

    const assets = Promise.race([
      preloadAssets((f) => {
        assetPct = f * 100;
        render();
      }),
      new Promise((r) => setTimeout(r, MAX_WAIT_MS)),
    ]);
    const intro = new Promise<void>((resolve) => {
      gsap.to(obj, {
        v: 100,
        duration: TOTAL_DURATION,
        ease: "linear",
        onUpdate: render,
        onComplete: resolve,
      });
    });
    Promise.all([assets, intro]).then(finish);

    return () => {
      lockScroll(false);
    };
  }, []);

  if (done) return null;

  const cubes = PHASES[phase];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-hidden bg-panel text-background"
    >
      {SLOTS.map((slot, i) => (
        <FloatingCube
          key={`${phase}-${i}`}
          top={slot.top}
          left={slot.left}
          size={slot.size}
          spinDuration={slot.spinDuration}
          reverse={slot.reverse}
          bobDuration={PHASE_DURATION}
          bobDelay={i * 0.04}
          faces={cubes[i].faces}
          mobHead={cubes[i].mobHead}
        />
      ))}

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-6">
        <p className="font-display text-2xl uppercase tracking-widest sm:text-3xl">
          Generating World
        </p>
        <div className="h-2 w-56 border-2 border-background/30">
          <div className="h-full bg-grass" style={{ width: `${progress}%` }} />
        </div>
        <p className="font-pixel text-[10px]">{progress}%</p>
      </div>
    </div>
  );
}
