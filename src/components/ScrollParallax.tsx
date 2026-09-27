"use client";

import { useLayoutEffect, useRef, type ComponentPropsWithRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ScrollParallaxProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  /** Fraction of viewport height traveled as the element passes through the
   * screen. Larger drifts further, giving it a sense of depth. */
  speed?: number;
  /** Also grows as it approaches the middle of the screen and shrinks again
   * leaving it, like it's drifting closer then further away. */
  depth?: boolean;
};

// Wraps children in a plain, statically-positioned element and animates
// *that* element's transform. Safe for normal content (text blocks, cards,
// other components) — just don't reach for this around something that is
// itself `position: absolute` and relies on a farther ancestor for its
// containing block, since animating a wrapper's transform turns the wrapper
// into the containing block for any absolutely-positioned descendant,
// silently changing what its offsets are relative to. For that case, attach
// the scroll-trigger tween directly to the element's own ref instead.
export function ScrollParallax({
  as: Tag = "div",
  className,
  children,
  speed = 0.2,
  depth = false,
}: ScrollParallaxProps) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.5 },
      });

      if (depth) {
        tl.fromTo(
          el,
          { y: () => window.innerHeight * speed * 0.5, scale: 0.88 },
          { y: () => -window.innerHeight * speed * 0.5, scale: 1, ease: "none" },
        ).to(el, { scale: 0.88, ease: "none" });
      } else {
        tl.fromTo(
          el,
          { y: () => window.innerHeight * speed * 0.5 },
          { y: () => -window.innerHeight * speed * 0.5, ease: "none" },
        );
      }
    }, el);

    return () => ctx.revert();
  }, [speed, depth]);

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
