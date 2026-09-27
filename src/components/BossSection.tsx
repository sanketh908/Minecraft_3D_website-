"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Boss3D } from "./Boss3D";

gsap.registerPlugin(ScrollTrigger);

type Stat = { label: string; value: string };

export function BossSection({
  id,
  name,
  tag,
  stats,
  fact,
  strategy,
  kind,
  glow,
  modelSize = 560,
  spinSpeed = 0.15,
}: {
  id?: string;
  name: string;
  tag: string;
  stats: Stat[];
  fact: string;
  strategy: string;
  kind: "dragon" | "warden" | "wither";
  glow: string;
  modelSize?: number;
  spinSpeed?: number;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const model = modelRef.current;
    if (!section || !text || !model) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([text, model], { autoAlpha: 1, x: 0, scale: 1 });
        return;
      }
      // Scrubbed to scroll position (no .play()/once) so this is a pure
      // function of scroll — scrolling down draws the text in from the
      // left and the model in from the right to center, scrolling back up
      // retracts both exactly the same way, like a sliding screen closing.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 85%", end: "top 30%", scrub: 0.4 },
      });
      tl.fromTo(text, { autoAlpha: 0, x: -140 }, { autoAlpha: 1, x: 0, ease: "none" }, 0).fromTo(
        model,
        { autoAlpha: 0, x: 280, scale: 0.65 },
        { autoAlpha: 1, x: 0, scale: 1, ease: "none" },
        0,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative flex min-h-svh items-center overflow-hidden px-6 py-24"
      style={{
        // Wither and Warden are themselves near-black, so the previous
        // near-black background (#17121a/#0a0a0d) swallowed them into a
        // silhouette with almost no visible detail. This is lighter
        // overall, plus a soft glow in the boss's own accent color
        // centered right behind the model — a rim-light effect that gives
        // a dark model an edge to read against instead of vanishing into
        // a flat dark field.
        background: `radial-gradient(circle at 78% 50%, ${glow}3d 0%, transparent 45%), radial-gradient(ellipse at 70% 50%, #35303f 0%, #1c1822 70%)`,
      }}
    >
      <p
        aria-hidden
        className="font-display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[18vw] uppercase leading-none text-white/[0.03]"
      >
        {name}
      </p>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.5fr]">
        <div ref={textRef}>
          <p className="font-pixel text-[10px] uppercase tracking-widest" style={{ color: glow }}>
            {tag}
          </p>
          <h2 className="font-display mt-3 text-4xl uppercase text-background sm:text-5xl">
            {name}
          </h2>
          <div className="mt-3 h-1 w-16" style={{ background: glow }} />

          <div className="mt-6 flex flex-col gap-3 border-y-2 border-white/10 py-5">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between gap-4">
                <span className="font-pixel text-[9px] uppercase tracking-widest text-background/50">
                  {stat.label}
                </span>
                <span className="font-display text-lg text-background">{stat.value}</span>
              </div>
            ))}
          </div>

          <p className="font-hand mt-6 max-w-md text-xl text-background/80">{fact}</p>

          <div className="mt-5 max-w-md border-l-2 pl-4" style={{ borderColor: glow }}>
            <p className="font-pixel text-[9px] uppercase tracking-widest" style={{ color: glow }}>
              Strategy
            </p>
            <p className="mt-1.5 text-sm text-background/60">{strategy}</p>
          </div>
        </div>

        <div ref={modelRef} className="flex w-full items-center justify-center">
          <Boss3D kind={kind} size={modelSize} spinSpeed={spinSpeed} />
        </div>
      </div>
    </section>
  );
}
