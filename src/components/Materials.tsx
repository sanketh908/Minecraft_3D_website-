"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Block3D, type BlockFaces } from "./Block3D";

gsap.registerPlugin(ScrollTrigger);

const uniform = (name: string): BlockFaces => ({
  top: `/images/blocks/${name}.png`,
  side: `/images/blocks/${name}.png`,
  bottom: `/images/blocks/${name}.png`,
});

// Fixed, hand-placed landing spots (in vmin, so they scale consistently
// with the viewport instead of stretching oddly on ultra-wide/fullscreen
// screens) — not randomized. Random per-mount angles occasionally sent two
// items down nearly the same trajectory, which read as them stacking on
// top of each other; a curated layout guarantees every slot is visibly
// distinct. Mostly left/right (the look that was actually preferred) with
// a few pushed further up/down for variety, and spaced widely enough that
// even the fullscreen (F11) case reads as "spread out" rather than
// clustered near the block.
const SPREAD_SLOTS = [
  { x: -34, y: 22 },
  { x: 34, y: -30 },
  { x: -44, y: -6 },
  { x: 44, y: 4 },
  { x: -36, y: -30 },
  { x: 36, y: 32 },
  { x: -52, y: 12 },
  { x: 52, y: -14 },
  { x: -30, y: -20 },
  { x: 30, y: 18 },
  { x: -48, y: 32 },
  { x: 48, y: -34 },
  { x: -40, y: -40 },
  { x: 40, y: 40 },
  { x: -56, y: -8 },
  { x: 56, y: 10 },
  { x: -60, y: 24 },
  { x: 60, y: -22 },
  { x: -24, y: 44 },
  { x: 24, y: -44 },
];

type Material = {
  name: string;
  fact: string;
  accent: string;
  bg: string;
  faces: BlockFaces;
  // The raw ore's own item plus a handful of things actually crafted from
  // it — cycled across the ejected chunks so what flies out isn't just N
  // copies of one icon, it's the ore's whole family of uses.
  items: string[];
  count: number;
};

// `bg` is a dark, ore-tinted section background (coal reads near-black,
// gold reads warm amber, diamond reads deep blue) — dark enough to keep
// light text readable, but clearly carrying that ore's color the way the
// boss sections each carry their own background. The whole page blends
// continuously between these as one shared backdrop (see `Materials`
// below), never a hard per-section cut.
const materials: Material[] = [
  {
    name: "Coal",
    fact: "Smelts nothing, fuels everything — every world starts with a pocket full of it.",
    accent: "#c9c9c9",
    bg: "#121212",
    faces: uniform("coal_ore"),
    // Furnace was here before but doesn't actually use coal in its recipe
    // (cobblestone only) — replaced with the real coal-crafted items per
    // minecraft.wiki's Coal usage list.
    items: [
      "/images/items/coal.png",
      "/images/crafted/torch.png",
      "/images/crafted/campfire.png",
      "/images/crafted/fire_charge.png",
      "/images/crafted/soul_torch.png",
      "/images/crafted/coal_block.png",
    ],
    // Count is always a clean multiple of items.length (2x) — cycling
    // `i % items.length` then guarantees every item appears exactly the
    // same number of times instead of some showing up more often just by
    // where the count cuts off mid-cycle.
    count: 12,
  },
  {
    name: "Iron",
    fact: "Tools, armor, rails, buckets — nothing else unlocks this much this early.",
    accent: "#e3b88f",
    bg: "#3a2a1f",
    faces: uniform("iron_ore"),
    // Hopper moved here from Redstone — its real recipe is iron ingots +
    // a chest, no redstone dust involved, per minecraft.wiki/w/Iron_Ingot.
    items: [
      "/images/items/iron_ingot.png",
      "/images/crafted/iron_sword.png",
      "/images/crafted/iron_pickaxe.png",
      "/images/crafted/bucket.png",
      "/images/crafted/iron_chestplate.png",
      "/images/crafted/shears.png",
      "/images/crafted/anvil.png",
      "/images/crafted/hopper.png",
      "/images/crafted/minecart.png",
    ],
    count: 18,
  },
  {
    name: "Redstone",
    fact: "Wires, repeaters, comparators — the closest thing this game has to real electricity.",
    accent: "#ff6a55",
    bg: "#3a0f0d",
    faces: uniform("redstone_ore"),
    // Hopper doesn't actually take redstone dust to craft — moved to Iron.
    // Dropper and Note Block added per minecraft.wiki/w/Redstone_Dust's
    // real crafting-ingredient list.
    items: [
      "/images/items/redstone.png",
      "/images/crafted/redstone_torch.png",
      "/images/crafted/redstone_repeater.png",
      "/images/crafted/redstone_comparator.png",
      "/images/crafted/piston.png",
      "/images/crafted/dispenser.png",
      "/images/crafted/redstone_lamp.png",
      "/images/crafted/dropper.png",
      "/images/crafted/note_block.png",
    ],
    count: 18,
  },
  {
    name: "Gold",
    fact: "Bad armor, fast furnaces, and the fastest way to a piglin's heart.",
    accent: "#ffd542",
    bg: "#4d3b06",
    faces: uniform("gold_ore"),
    items: [
      "/images/items/gold_ingot.png",
      "/images/crafted/golden_apple.png",
      "/images/crafted/golden_pickaxe.png",
      "/images/crafted/clock.png",
      "/images/crafted/golden_chestplate.png",
      "/images/crafted/powered_rail.png",
      "/images/crafted/golden_carrot.png",
    ],
    count: 14,
  },
  {
    name: "Diamond",
    fact: "Four diamonds and an obsidian frame is still the game's biggest turning point.",
    accent: "#5fe4ff",
    bg: "#073344",
    faces: uniform("diamond_ore"),
    // Enchanting Table added per minecraft.wiki/w/Diamond's real
    // crafting-ingredient list.
    items: [
      "/images/items/diamond.png",
      "/images/crafted/diamond_sword.png",
      "/images/crafted/diamond_pickaxe.png",
      "/images/crafted/diamond_chestplate.png",
      "/images/crafted/diamond_boots.png",
      "/images/crafted/diamond_axe.png",
      "/images/crafted/jukebox.png",
      "/images/crafted/enchanting_table.png",
    ],
    count: 16,
  },
  {
    name: "Emerald",
    fact: "The rarest color in the game, and villagers refuse to take anything else.",
    accent: "#5cf29a",
    bg: "#0c3322",
    faces: uniform("emerald_ore"),
    // Arrow added — a fletcher villager trade good, rounding out the
    // "things you trade emeralds for" set.
    items: [
      "/images/items/emerald.png",
      "/images/crafted/enchanted_book.png",
      "/images/crafted/bell.png",
      "/images/crafted/map.png",
      "/images/crafted/saddle.png",
      "/images/crafted/name_tag.png",
      "/images/crafted/totem_of_undying.png",
      "/images/crafted/arrow.png",
    ],
    count: 16,
  },
];

function MaterialBlock({ material }: { material: Material }) {
  const sectionRef = useRef<HTMLElement>(null);
  const chunkRefs = useRef<(HTMLDivElement | null)[]>([]);
  const groupRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const chunks = chunkRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const group = groupRef.current;
    const block = blockRef.current;
    const text = textRef.current;
    if (!section || !group || !block || !text || chunks.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(chunks, { autoAlpha: 0 });
        gsap.set(group, { autoAlpha: 1, y: 0 });
        gsap.set([block, text], { autoAlpha: 1, x: 0, y: 0, scale: 1 });
        return;
      }
      // Pinned in three beats so the payoff is never scrolled past before
      // it's visible: the block enters and HOLDS dead center (no motion of
      // its own) for the entire middle stretch while every item ejects out
      // toward the page edges in its own random direction; only once the
      // last item has landed does the block let go and rise out of view,
      // releasing the pin. Reversible the whole way — scrolling back up
      // re-plays every beat backward. A generous pin distance (this
      // section is "way bigger" than a plain 100vh scroll) gives all that
      // room to actually read as smooth instead of rushed.
      const enterEnd = 0.1;
      const ejectStart = enterEnd;
      const ejectEnd = 0.82;
      const exitStart = 0.87;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${2200 + chunks.length * 140}`,
          scrub: 0.6,
          pin: true,
          pinSpacing: true,
        },
      });

      tl.fromTo(
        block,
        { autoAlpha: 0, scale: 0.6 },
        { autoAlpha: 1, scale: 1, ease: "none", duration: enterEnd },
        0,
      ).fromTo(
        text,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, ease: "none", duration: enterEnd },
        0,
      );

      // Fixed layout, not randomized (see SPREAD_SLOTS) — distance and
      // final size are both derived directly from each slot's own
      // position, and each chunk's start time is a plain linear cascade
      // by index, so the whole thing is fully deterministic. Duration is
      // still solved backward from `ejectEnd`, so no matter how staggered
      // the starts are, every chunk lands at the same moment — which is
      // what the block's hold-until-everyone's-landed timing depends on.
      const ejectSpan = ejectEnd - ejectStart;
      chunks.forEach((el, i) => {
        const slot = SPREAD_SLOTS[i % SPREAD_SLOTS.length];
        const dist = Math.hypot(slot.x, slot.y);
        const rot = slot.x * 0.6;
        const growTo = 1 + Math.min(1, Math.max(0, (dist - 40) / 30)) * 0.7;
        const start = ejectStart + (i / chunks.length) * ejectSpan * 0.5;
        const duration = ejectEnd - start;

        tl.fromTo(
          el,
          { autoAlpha: 0, x: 0, y: 0, rotate: 0, scale: 0.22 },
          {
            autoAlpha: 1,
            x: `${slot.x}vmin`,
            y: `${slot.y}vmin`,
            rotate: rot,
            scale: growTo,
            ease: "none",
            duration,
          },
          start,
        );
      });

      // Block + text hold perfectly still through the entire eject window
      // above, then rise together and fade — only once every item has
      // already reached its resting place out at the edges.
      tl.to(group, { y: -160, autoAlpha: 0, ease: "none", duration: 1 - exitStart }, exitStart);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 flex h-svh items-center justify-center overflow-hidden px-6">
      {Array.from({ length: material.count }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            chunkRefs.current[i] = el;
          }}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 opacity-0 drop-shadow-lg"
          style={{
            backgroundImage: `url(${material.items[i % material.items.length]})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
          }}
        />
      ))}

      <div ref={groupRef} className="relative z-10 flex flex-col items-center">
        <div ref={blockRef}>
          <Block3D size={190} faces={material.faces} />
        </div>
        <div ref={textRef} className="mt-8 flex max-w-md flex-col items-center text-center">
          <p className="font-pixel text-[10px] uppercase tracking-widest" style={{ color: material.accent }}>
            Mine It
          </p>
          <h3 className="font-display mt-2 text-4xl uppercase text-background sm:text-5xl">
            {material.name}
          </h3>
          <div className="mt-3 h-1 w-16" style={{ background: material.accent }} />
          <p className="font-hand mt-5 text-xl text-background/80">{material.fact}</p>
        </div>
      </div>
    </section>
  );
}

export function Materials() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const bg = bgRef.current;
    if (!wrap || !bg) return;

    gsap.set(bg, { backgroundColor: materials[0].bg });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // One continuous linear color interpolation spanning the whole
    // materials scroll region, tied 1:1 to scroll — not per-section hard
    // cuts. `ease: "none"` keeps the color change perfectly proportional
    // to scroll distance so it reads as a slow, imperceptible gradient
    // rather than a shift anyone can point to.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: wrap, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      for (let i = 1; i < materials.length; i++) {
        tl.to(bg, { backgroundColor: materials[i].bg, ease: "none", duration: 1 }, i - 1);
      }
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div id="materials" ref={wrapRef} className="relative">
      <div ref={bgRef} className="absolute inset-0 z-0" aria-hidden />
      {materials.map((material) => (
        <MaterialBlock key={material.name} material={material} />
      ))}
    </div>
  );
}
