import type { CSSProperties } from "react";

// `--s` is the screen-size scale factor set in app/layout.tsx (1 on a
// ~900px-tall laptop, down to 0.5 on phones, up to 1.6 on big monitors).
// 3D pieces keep their fixed-px geometry and are scaled as a whole, so
// every cube/head/boss shrinks and grows with the screen.
export const scaled = (px: number) => `calc(${px}px * var(--s, 1))`;
export const scaleInner = (px: number): CSSProperties => ({
  width: px,
  height: px,
  transform: "scale(var(--s, 1))",
  transformOrigin: "0 0",
});
