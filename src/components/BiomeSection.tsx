"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AmbientMobHead } from "./AmbientMobHead";
import type { MobHeadSpec } from "./MobHead";

gsap.registerPlugin(ScrollTrigger);

// Letters alternate entry direction so the name visibly assembles from both
// sides as the section scrolls into view, instead of just fading up.
const LETTER_DIRECTIONS = [
  { x: -90, y: -40 },
  { x: 90, y: 40 },
  { x: -70, y: 50 },
  { x: 70, y: -50 },
];

type Mob = { spec: MobHeadSpec; name: string };

export function BiomeSection({
  name,
  tag,
  fact,
  image,
  imageAlt,
  bgImage,
  mobs,
  reverse = false,
  priority = false,
}: {
  name: string;
  tag: string;
  fact: string;
  image: string;
  imageAlt: string;
  bgImage: string;
  mobs: Mob[];
  reverse?: boolean;
  priority?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const nameRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const infoRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const letters = nameRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    const info = infoRef.current;
    const imageEl = imageRef.current;
    const bgEl = bgRef.current;
    if (!section || !info || !imageEl || !bgEl || letters.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(letters, { autoAlpha: 1, x: 0, y: 0 });
        gsap.set([info, imageEl], { autoAlpha: 1, x: 0 });
        gsap.set(bgEl, { autoAlpha: 0.45 });
        return;
      }
      // Scrubbed, not `once` — scrolling down assembles the biome's name
      // from both sides and slides the info panel in from one side while
      // the photo slides in from the other, all converging on the middle;
      // scrolling back up sends everything back out exactly the same way,
      // same reversible language as the boss sections.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 82%", end: "top 28%", scrub: 0.5 },
      });

      const infoFrom = reverse ? 160 : -160;
      const imageFrom = reverse ? -160 : 160;
      // `info` only slides (no autoAlpha) — its own opacity would
      // multiply with each letter's independent autoAlpha below (both are
      // 0->1 over the same window), compounding into a quadratic fade
      // that made the name look stuck nearly invisible far longer than
      // the rest of the panel. The tag/underline/fact text just rides the
      // slide at full opacity; the letters handle their own fade-in.
      tl.fromTo(info, { x: infoFrom }, { x: 0, ease: "none" }, 0).fromTo(
        imageEl,
        { autoAlpha: 0, x: imageFrom, scale: 0.92 },
        { autoAlpha: 1, x: 0, scale: 1, ease: "none" },
        0,
      );

      letters.forEach((el, i) => {
        const dir = LETTER_DIRECTIONS[i % LETTER_DIRECTIONS.length];
        tl.fromTo(
          el,
          { autoAlpha: 0, x: dir.x, y: dir.y },
          { autoAlpha: 1, x: 0, y: 0, ease: "none" },
          0,
        );
      });

      // The atmospheric background photo dissolves in as this section
      // approaches and dissolves back out as it leaves — tied to the
      // section's entire time on screen (not the shorter text/image
      // window above), so it overlaps with the next biome's own photo
      // fading in underneath it, reading as a continuous cross-dissolve
      // rather than a hard swap.
      gsap.timeline({
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.6 },
      })
        .fromTo(bgEl, { autoAlpha: 0 }, { autoAlpha: 0.45, ease: "none", duration: 0.2 }, 0)
        .to(bgEl, { autoAlpha: 0.45, duration: 0.6 }, 0.2)
        .to(bgEl, { autoAlpha: 0, ease: "none", duration: 0.2 }, 0.8);
    }, section);

    return () => ctx.revert();
  }, [reverse]);

  const textBlock = (
    <div ref={infoRef} className="flex flex-col justify-center">
      <p className="font-pixel text-[10px] uppercase tracking-widest text-gold">{tag}</p>
      <h2 className="font-display mt-3 flex flex-wrap text-4xl uppercase leading-none text-background sm:text-6xl">
        {name.split("").map((letter, i) => (
          <span
            key={i}
            ref={(el) => {
              nameRefs.current[i] = el;
            }}
            className="inline-block"
          >
            {letter === " " ? " " : letter}
          </span>
        ))}
      </h2>
      <div className="mt-4 h-1 w-16 bg-gold" />
      <p className="font-hand mt-6 max-w-md text-2xl text-background/85">{fact}</p>
    </div>
  );

  const imageBlock = (
    <div ref={imageRef} className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/11]">
      <Image
        src={image}
        alt={imageAlt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
        priority={priority}
      />
    </div>
  );

  return (
    <section ref={sectionRef} className="relative flex min-h-svh items-center overflow-hidden px-6 py-20">
      <div ref={bgRef} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
        <Image src={bgImage} alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/50" />
      </div>

      {mobs.map((mob, i) => (
        <AmbientMobHead
          key={mob.name}
          top={i === 0 ? "12%" : "78%"}
          left={reverse ? (i === 0 ? "8%" : "92%") : i === 0 ? "92%" : "8%"}
          size={i === 0 ? 46 : 40}
          spec={mob.spec}
          name={mob.name}
          spinDuration={12 + i * 2}
          parallaxSpeed={0.3}
          variant={i === 0 ? "bob" : "sway"}
          reverse={i === 1}
        />
      ))}

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-2">
        {reverse ? (
          <>
            {imageBlock}
            {textBlock}
          </>
        ) : (
          <>
            {textBlock}
            {imageBlock}
          </>
        )}
      </div>
    </section>
  );
}
