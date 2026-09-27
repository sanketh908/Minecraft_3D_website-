import { useEffect, type RefObject } from "react";

// Pauses a looping GSAP idle tween while its element is off screen. There
// are ~20 spinning heads/blocks on the page and each tween writes a style
// every frame — letting them all run while scrolled away was pure waste.
export function usePauseOffscreen(
  ref: RefObject<HTMLElement | null>,
  tween: RefObject<{ pause: () => unknown; resume: () => unknown } | null>,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tween.current?.resume();
        else tween.current?.pause();
      },
      { rootMargin: "150px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, tween]);
}
