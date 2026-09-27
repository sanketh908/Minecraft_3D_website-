"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const WORD = "BOSSES";

// Each letter flies in from a different direction — alternating corners and
// edges — so the word visibly assembles itself from all sides instead of
// just fading up, which is what makes it read as a dramatic, powerful entrance.
const DIRECTIONS = [
  { x: -260, y: -180, rotate: -60 },
  { x: 260, y: -180, rotate: 60 },
  { x: -320, y: 0, rotate: 0 },
  { x: 320, y: 0, rotate: 0 },
  { x: -260, y: 200, rotate: 50 },
  { x: 260, y: 200, rotate: -50 },
];

export function BossesIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const letters = letterRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (!section || letters.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(letters, { autoAlpha: 1, x: 0, y: 0, rotate: 0, scale: 1 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 90%", end: "top 20%", scrub: 0.5 },
      });
      letters.forEach((el, i) => {
        const dir = DIRECTIONS[i % DIRECTIONS.length];
        tl.fromTo(
          el,
          { autoAlpha: 0, x: dir.x, y: dir.y, rotate: dir.rotate, scale: 2 },
          { autoAlpha: 1, x: 0, y: 0, rotate: 0, scale: 1, ease: "none" },
          0,
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[70vh] min-h-[420px] items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 50%, #17121a 0%, #0a0a0d 70%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,90,60,0.15), transparent 60%)" }}
      />
      <h2 className="font-display relative flex text-[16vw] uppercase leading-none text-background sm:text-[13vw]">
        {WORD.split("").map((letter, i) => (
          <span
            key={i}
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            className="inline-block"
            style={{ textShadow: "0 0 40px rgba(224,99,44,0.5)" }}
          >
            {letter}
          </span>
        ))}
      </h2>
    </section>
  );
}
