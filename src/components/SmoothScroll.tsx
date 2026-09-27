"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let locked = false;

// Freezes the page behind the loading screen / fullscreen menu. Both halves
// are needed: Lenis drives wheel scrolling itself (so body overflow alone
// doesn't stop it), and touch devices scroll natively — `html` has to take
// the overflow, since its overflow-x: clip stops body's from propagating.
export function lockScroll(lock: boolean) {
  locked = lock;
  document.documentElement.style.overflow = lock ? "hidden" : "";
  if (lock) lenis?.stop();
  else lenis?.start();
}

// Smooth-scrolls to an in-page anchor like "#bosses".
export function scrollToHash(hash: string) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  history.replaceState(null, "", hash);
  if (lenis) lenis.scrollTo(target, { force: true });
  else target.scrollIntoView({ behavior: "smooth" });
}

export function SmoothScroll() {
  useEffect(() => {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    if (locked) lenis.stop();
    const instance = lenis;

    instance.on("scroll", ScrollTrigger.update);

    // Named so cleanup removes the same function it added (removing
    // `lenis.raf` never matched the arrow passed to add()).
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
