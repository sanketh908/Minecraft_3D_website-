"use client";

import { useLayoutEffect, useRef, type ComponentPropsWithRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  as?: ElementType;
  className?: string;
  y?: number;
  stagger?: number;
  delay?: number;
  children: ReactNode;
};

export function Reveal({
  as: Tag = "div",
  className,
  y = 40,
  stagger = 0,
  delay = 0,
  children,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(stagger > 0 ? el.children : el, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        stagger > 0 ? el.children : el,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: "power3.out",
          stagger,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [y, stagger, delay]);

  // @react-three/fiber's global JSX augmentation (added for the boss 3D
  // models) widens JSX.IntrinsicElements enough to break plain `ElementType`
  // resolution here — pin it to a concrete, ref/className/children-shaped
  // element instead of leaving it an ambiguous open union.
  const Component = Tag as ElementType<ComponentPropsWithRef<"div">>;
  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}
