"use client";

import { useLayoutEffect, useRef, type ComponentPropsWithRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

type SplitRevealProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  trigger?: "load" | "scroll";
  delay?: number;
};

export function SplitReveal({
  as: Tag = "h2",
  className,
  children,
  trigger = "scroll",
  delay = 0,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const split = new SplitText(el, { type: "words", wordsClass: "inline-block" });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      gsap.set(split.words, { autoAlpha: 1, y: 0, rotate: 0 });
      return () => split.revert();
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        split.words,
        { autoAlpha: 0, y: 44, rotate: 3 },
        {
          autoAlpha: 1,
          y: 0,
          rotate: 0,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.06,
          delay,
          scrollTrigger:
            trigger === "scroll" ? { trigger: el, start: "top 85%", once: true } : undefined,
        },
      );
    }, el);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [trigger, delay]);

  // @react-three/fiber's global JSX augmentation (added for the boss 3D
  // models) widens JSX.IntrinsicElements enough to break plain `ElementType`
  // resolution here — pin it to a concrete, ref/className/children-shaped
  // element instead of leaving it an ambiguous open union.
  const Component = Tag as ElementType<ComponentPropsWithRef<"div">>;
  return (
    <Component ref={ref as ComponentPropsWithRef<"div">["ref"]} className={className}>
      {children}
    </Component>
  );
}
