"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Four entry directions cycled by index (not randomized) so tiles in the
// same row don't all happen to roll the same direction and read as one
// block sliding in together — each tile visibly comes from its own side.
const DIRECTIONS = [
  { x: -70, y: 0, rot: -6 },
  { x: 0, y: 65, rot: 4 },
  { x: 70, y: 0, rot: 6 },
  { x: 0, y: -65, rot: -4 },
];

export function GalleryTile({ index, children }: { index: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(el, { autoAlpha: 1, x: 0, y: 0, rotate: 0, scale: 1 });
        return;
      }
      const { x, y, rot } = DIRECTIONS[index % DIRECTIONS.length];
      // Scrubbed, not `once` — the tile is genuinely not in place yet when
      // it's off screen, and slides into its exact grid slot as it's
      // scrolled into view, reversing cleanly if you scroll back up.
      gsap.fromTo(
        el,
        { autoAlpha: 0, x, y, rotate: rot, scale: 0.85 },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 92%", end: "top 55%", scrub: 0.5 },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [index]);

  return <div ref={ref}>{children}</div>;
}
