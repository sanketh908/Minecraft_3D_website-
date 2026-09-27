"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const WORD = "MINECRAFT";

// Letters start lightly jumbled around their real position (small offset +
// tilt, not flung off-screen) so the word is already legible at rest, then
// settle into a perfect line over a short scroll — one scroll tick should
// be enough to finish it, not a long scroll the word has already scrolled
// past by the time it resolves.
const JUMBLE = [
  { x: -6, y: 6, rot: -7 },
  { x: 5, y: -7, rot: 6 },
  { x: -4, y: 8, rot: -5 },
  { x: 7, y: -4, rot: 8 },
  { x: -8, y: -5, rot: -6 },
  { x: 5, y: 7, rot: 5 },
  { x: -5, y: -8, rot: -8 },
  { x: 8, y: 4, rot: 7 },
  { x: -6, y: 6, rot: -5 },
];

export function HeroTitle() {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const letters = letterRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    const section = letters[0]?.closest("section");
    if (!section || letters.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(letters, { autoAlpha: 1, x: 0, y: 0, rotate: 0 });
        return;
      }
      // Short scrub window (a single scroll tick) instead of a long one —
      // the word is already readable (just jumbled) at rest, and settles
      // into line almost immediately once scrolling starts. Reversible:
      // scrolling back to the top re-jumbles it exactly the way it came.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "+=120", scrub: 0.3 },
      });
      letters.forEach((el, i) => {
        const { x, y, rot } = JUMBLE[i];
        tl.fromTo(
          el,
          { autoAlpha: 1, x, y, rotate: rot },
          { autoAlpha: 1, x: 0, y: 0, rotate: 0, ease: "none" },
          0,
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <h1 className="font-minecraft mt-3 flex gap-1 text-[min(12vw,4.5rem)] uppercase leading-none text-foreground drop-shadow-lg sm:gap-1.5 md:text-[min(6vw,4.5rem)]">
      {WORD.split("").map((letter, i) => (
        <span
          key={i}
          ref={(el) => {
            letterRefs.current[i] = el;
          }}
          className="inline-block"
        >
          {letter}
        </span>
      ))}
    </h1>
  );
}
