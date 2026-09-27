"use client";

import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scaled, scaleInner } from "@/lib/scale";
import { usePauseOffscreen } from "@/lib/offscreen";
import { MobHeadFaces, type MobHeadSpec } from "./MobHead";

gsap.registerPlugin(ScrollTrigger);

const IDLE_ANIMATION: Record<"spin" | "bob" | "sway", string | undefined> = {
  spin: undefined,
  bob: "mob-bob 2.4s ease-in-out infinite",
  sway: "mob-sway 3.2s ease-in-out infinite",
};

export function AmbientMobHead({
  top,
  left,
  size,
  spec,
  name,
  spinDuration = 9,
  reverse,
  parallaxSpeed = 0.25,
  variant = "spin",
  absolute = true,
}: {
  top?: string;
  left?: string;
  size: number;
  spec: MobHeadSpec;
  name: string;
  spinDuration?: number;
  reverse?: boolean;
  parallaxSpeed?: number;
  variant?: "spin" | "bob" | "sway";
  // false renders as a normal-flow centerpiece (no absolute positioning, no
  // scroll-parallax drift) instead of a scattered background decoration.
  absolute?: boolean;
}) {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: -14, y: 0 });
  const idleTween = useRef<gsap.core.Tween | null>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const reducedRef = useRef(false);
  usePauseOffscreen(parallaxRef, idleTween);

  const applyRotation = () => {
    if (cubeRef.current) {
      cubeRef.current.style.transform = `rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg)`;
    }
  };

  const startIdle = () => {
    if (reducedRef.current) return;
    idleTween.current?.kill();
    const dir = reverse ? -1 : 1;
    idleTween.current = gsap.to(rot.current, {
      y: rot.current.y + dir * 360,
      duration: spinDuration,
      ease: "none",
      repeat: -1,
      onUpdate: applyRotation,
    });
  };

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    applyRotation();
    startIdle();
    return () => {
      idleTween.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const el = parallaxRef.current;
    if (!el || reducedRef.current || !absolute) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: () => window.innerHeight * parallaxSpeed * 0.4 },
        {
          y: () => -window.innerHeight * parallaxSpeed * 0.4,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.5 },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [parallaxSpeed, absolute]);

  const onPointerDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    idleTween.current?.kill();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    rot.current.y += dx * 0.8;
    rot.current.x = Math.max(-80, Math.min(80, rot.current.x - dy * 0.8));
    applyRotation();
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    startIdle();
  };

  return (
    <div
      ref={parallaxRef}
      aria-hidden
      className={absolute ? "pointer-events-none absolute" : "pointer-events-none"}
      style={absolute ? { top, left, width: scaled(size), height: scaled(size) } : { width: scaled(size), height: scaled(size) }}
    >
      <div
        className="pointer-events-auto h-full w-full touch-pan-y select-none"
        style={{ animation: IDLE_ANIMATION[variant], willChange: IDLE_ANIMATION[variant] ? "transform" : undefined }}
        title={`Drag to spin the ${name}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="cursor-grab [perspective:500px] active:cursor-grabbing" style={scaleInner(size)}>
          <div
            ref={cubeRef}
            className="relative h-full w-full [transform-style:preserve-3d]"
            style={{ willChange: "transform" }}
          >
            <MobHeadFaces size={size} spec={spec} />
          </div>
        </div>
      </div>
    </div>
  );
}
