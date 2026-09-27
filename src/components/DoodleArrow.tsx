"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function DoodleArrow({ className, flip = false }: { className?: string; flip?: boolean }) {
  const pathRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const path = pathRef.current;
    const head = headRef.current;
    if (!path || !head) return;

    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.set(head, { autoAlpha: 0 });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(path, { strokeDashoffset: 0 });
      gsap.set(head, { autoAlpha: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: path, start: "top 85%", once: true },
      });
      tl.to(path, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }).to(
        head,
        { autoAlpha: 1, duration: 0.2 },
        "-=0.1",
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <svg
      viewBox="0 0 120 90"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      fill="none"
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d="M6 6c20 0 55 5 60 35 3 20-15 30-35 25"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        ref={headRef}
        d="M18 55 12 68 30 64"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
