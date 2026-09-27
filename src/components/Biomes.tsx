"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BiomeSection } from "./BiomeSection";
import { Reveal } from "./Reveal";
import {
  CREEPER_HEAD,
  ZOMBIE_HEAD,
  SKELETON_HEAD,
  COW_HEAD,
  VILLAGER_HEAD,
  SNOW_GOLEM_HEAD,
  WOLF_HEAD,
  SPIDER_HEAD,
  SLIME_HEAD,
  ENDERMAN_HEAD,
  SHEEP_HEAD,
  PIG_HEAD,
  CHICKEN_HEAD,
  type MobHeadSpec,
} from "./MobHead";

gsap.registerPlugin(ScrollTrigger);

type Mob = { spec: MobHeadSpec; name: string };

const biomes = [
  {
    name: "Plains",
    tag: "Overworld · Common",
    fact: "Minecraft's most common biome — flat, wide, and the one most villages call home.",
    image: "/images/biomes/plains-real.jpg",
    bgImage: "/images/biomes-bg/plains.jpg",
    bgColor: "#3f5426",
    mobs: [{ spec: COW_HEAD, name: "cow" }, { spec: SHEEP_HEAD, name: "sheep" }] as Mob[],
  },
  {
    name: "Jungle",
    tag: "Overworld · Uncommon",
    fact: "Thick canopies and bamboo groves hide ocelots, parrots, and temples rigged with tripwire traps.",
    image: "/images/biomes/jungle.jpg",
    bgImage: "/images/biomes-bg/jungle.jpg",
    bgColor: "#123821",
    mobs: [{ spec: SPIDER_HEAD, name: "spider" }, { spec: CHICKEN_HEAD, name: "chicken" }] as Mob[],
  },
  {
    name: "Cherry Grove",
    tag: "Overworld · Rare",
    fact: "One of the rarest biomes in the game, added in 2023 with a single job: to be beautiful.",
    image: "/images/biomes/cherry-grove.jpg",
    bgImage: "/images/biomes-bg/cherry-grove.jpg",
    bgColor: "#5c2f42",
    mobs: [{ spec: PIG_HEAD, name: "pig" }, { spec: VILLAGER_HEAD, name: "villager" }] as Mob[],
  },
  {
    name: "Badlands",
    tag: "Overworld · Rare",
    fact: "Terracotta cliffs striped like layers of cake — and the one biome where gold ore hides near the surface.",
    image: "/images/biomes/badlands.jpg",
    bgImage: "/images/biomes-bg/badlands.jpg",
    bgColor: "#5c2f18",
    mobs: [{ spec: SKELETON_HEAD, name: "skeleton" }, { spec: ENDERMAN_HEAD, name: "enderman" }] as Mob[],
  },
  {
    name: "Desert",
    tag: "Overworld · Arid",
    fact: "Miles of sand and almost no water — but every desert hides a temple with a pressure-plate trap over free loot.",
    image: "/images/biomes/desert.jpg",
    bgImage: "/images/biomes-bg/desert.jpg",
    bgColor: "#5c4a22",
    mobs: [{ spec: ZOMBIE_HEAD, name: "husk" }, { spec: SPIDER_HEAD, name: "spider" }] as Mob[],
  },
  {
    name: "Savanna",
    tag: "Overworld · Common",
    fact: "Acacia trees on flat golden grass built for horses and villages — the only biome llamas naturally spawn in.",
    image: "/images/biomes/savanna.jpg",
    bgImage: "/images/biomes-bg/savanna.jpg",
    bgColor: "#4a3c18",
    mobs: [{ spec: VILLAGER_HEAD, name: "villager" }, { spec: COW_HEAD, name: "cow" }] as Mob[],
  },
  {
    name: "Frozen Ocean",
    tag: "Overworld · Aquatic",
    fact: "One of twelve ocean variants — icebergs drift on the surface while the water beneath rarely freezes.",
    image: "/images/biomes/frozen-ocean.jpg",
    bgImage: "/images/biomes-bg/frozen-ocean.jpg",
    bgColor: "#1f3d4d",
    mobs: [{ spec: SNOW_GOLEM_HEAD, name: "snow golem" }, { spec: WOLF_HEAD, name: "wolf" }] as Mob[],
  },
  {
    name: "Ice Spikes",
    tag: "Overworld · Very Rare",
    fact: "Towering packed-ice spires that generate nowhere else — one of the rarest, strangest skylines in the game.",
    image: "/images/biomes/ice-spikes.jpg",
    bgImage: "/images/biomes-bg/ice-spikes.jpg",
    bgColor: "#274a54",
    mobs: [{ spec: SNOW_GOLEM_HEAD, name: "snow golem" }, { spec: WOLF_HEAD, name: "wolf" }] as Mob[],
  },
  {
    name: "Mushroom Fields",
    tag: "Overworld · Extremely Rare",
    fact: "So rare that hostile mobs can't even spawn here — giant mushrooms and mooshrooms roam a biome most players never find.",
    image: "/images/biomes/mushroom-fields.jpg",
    bgImage: "/images/biomes-bg/mushroom-fields.jpg",
    bgColor: "#5c2230",
    mobs: [{ spec: COW_HEAD, name: "mooshroom" }, { spec: SLIME_HEAD, name: "slime" }] as Mob[],
  },
  {
    name: "Lush Caves",
    tag: "Underground · Rare",
    fact: "The only place azalea trees, glow berries and spore blossoms all grow together underground.",
    image: "/images/biomes/lush-caves.jpg",
    bgImage: "/images/biomes-bg/lush-caves.jpg",
    bgColor: "#163d2c",
    mobs: [{ spec: CREEPER_HEAD, name: "creeper" }, { spec: WOLF_HEAD, name: "wolf" }] as Mob[],
  },
  {
    name: "Deep Dark",
    tag: "Underground · Rare",
    fact: "Pitch black and sound-sensitive — sculk spreads through the ancient cities the Warden was built to guard.",
    image: "/images/biomes/deep-dark.jpg",
    bgImage: "/images/biomes-bg/deep-dark.jpg",
    bgColor: "#102224",
    mobs: [{ spec: ENDERMAN_HEAD, name: "enderman" }, { spec: SKELETON_HEAD, name: "skeleton" }] as Mob[],
  },
  {
    name: "The End",
    tag: "The End · Final",
    fact: "A void of nothing but endstone and one dragon — the closing chapter of Minecraft's main story.",
    image: "/images/biomes/the-end.jpg",
    bgImage: "/images/biomes-bg/the-end.jpg",
    bgColor: "#150f1f",
    mobs: [{ spec: ENDERMAN_HEAD, name: "enderman" }, { spec: CREEPER_HEAD, name: "creeper" }] as Mob[],
  },
];

export function Biomes() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const bg = bgRef.current;
    if (!wrap || !bg) return;

    gsap.set(bg, { backgroundColor: biomes[0].bgColor });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Same technique as the materials section: one continuous linear color
    // interpolation spanning every biome, tied 1:1 to scroll — the base
    // tone shifts the whole way through, never a hard per-section cut.
    // Each biome's own photo then dissolves in and out on top of this.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: wrap, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      for (let i = 1; i < biomes.length; i++) {
        tl.to(bg, { backgroundColor: biomes[i].bgColor, ease: "none", duration: 1 }, i - 1);
      }
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div id="biomes" ref={wrapRef} className="relative">
      <div ref={bgRef} className="absolute inset-0 z-0" aria-hidden />

      <div className="relative z-10 overflow-hidden px-6 pb-4 pt-24">
        <Reveal className="mx-auto max-w-xl text-center" y={24}>
          <p className="font-pixel text-[10px] uppercase tracking-widest text-gold">
            Discover Biomes
          </p>
          <h2 className="font-display mt-3 text-3xl uppercase text-background sm:text-4xl">
            Every World Is Different
          </h2>
          <p className="mt-3 text-background/80">
            A biome is the terrain itself, not a version of the game &mdash;
            keep scrolling to walk through {biomes.length} of them.
          </p>
        </Reveal>
      </div>

      {biomes.map((biome, i) => (
        <BiomeSection key={biome.name} {...biome} imageAlt={biome.name} reverse={i % 2 === 1} priority={i === 0} />
      ))}
    </div>
  );
}
