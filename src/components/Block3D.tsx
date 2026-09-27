"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { gsap } from "gsap";
import { scaled, scaleInner } from "@/lib/scale";
import { usePauseOffscreen } from "@/lib/offscreen";

export type BlockFaces = { top: string; side: string; bottom: string; topTint?: string };

export const GRASS_FACES: BlockFaces = {
  top: "/images/blocks/grass_block_top.png",
  side: "/images/blocks/grass_block_side.png",
  bottom: "/images/blocks/dirt.png",
  // grass_block_top.png ships as a grayscale mask meant to be multiplied by
  // Minecraft's biome grass color at runtime, so it needs the same tint here.
  topTint: "#79c05a",
};

function faceStyle(transform: string, img: string, tint?: string): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${img})`,
    backgroundSize: "cover",
    backgroundColor: tint,
    backgroundBlendMode: tint ? "multiply" : undefined,
    imageRendering: "pixelated",
    transform,
    border: "1px solid rgba(0,0,0,0.45)",
    backfaceVisibility: "hidden",
    // Forces the browser to composite each face on its own layer instead of
    // repainting it every frame, which is what caused a visible flicker as
    // faces swept past their edge-on angle during rotation.
    willChange: "transform",
  };
}

export function CubeFaces({ size, faces }: { size: number; faces: BlockFaces }) {
  const half = `${size / 2}px`;
  return (
    <>
      <div style={faceStyle(`rotateY(0deg) translateZ(${half})`, faces.side)} />
      <div style={faceStyle(`rotateY(180deg) translateZ(${half})`, faces.side)} />
      <div style={faceStyle(`rotateY(90deg) translateZ(${half})`, faces.side)} />
      <div style={faceStyle(`rotateY(-90deg) translateZ(${half})`, faces.side)} />
      <div style={faceStyle(`rotateX(90deg) translateZ(${half})`, faces.top, faces.topTint)} />
      <div style={faceStyle(`rotateX(-90deg) translateZ(${half})`, faces.bottom)} />
    </>
  );
}

export function Block3D({
  size = 220,
  faces = GRASS_FACES,
  pulseKey,
}: {
  size?: number;
  faces?: BlockFaces;
  pulseKey?: string | number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: -18, y: 35 });
  const idleTween = useRef<gsap.core.Tween | null>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const mounted = useRef(false);
  usePauseOffscreen(wrapRef, idleTween);

  const applyRotation = () => {
    if (cubeRef.current) {
      cubeRef.current.style.transform = `rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg)`;
    }
  };

  const startIdle = () => {
    idleTween.current?.kill();
    idleTween.current = gsap.to(rot.current, {
      y: rot.current.y + 360,
      duration: 24,
      ease: "none",
      repeat: -1,
      onUpdate: applyRotation,
    });
  };

  useEffect(() => {
    applyRotation();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) startIdle();
    return () => {
      idleTween.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !wrapRef.current) return;
    gsap.fromTo(
      wrapRef.current,
      { scale: 0.78, rotateZ: -5 },
      { scale: 1, rotateZ: 0, duration: 0.5, ease: "back.out(2.5)" },
    );
  }, [pulseKey]);

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
    rot.current.y += dx * 0.6;
    rot.current.x = Math.max(-70, Math.min(70, rot.current.x - dy * 0.6));
    applyRotation();
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    startIdle();
  };

  return (
    <div
      ref={wrapRef}
      className="touch-pan-y select-none"
      style={{ width: scaled(size), height: scaled(size) }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="[perspective:1000px]" style={scaleInner(size)}>
        <div
          ref={cubeRef}
          className="relative cursor-grab [transform-style:preserve-3d] active:cursor-grabbing"
          style={{ width: size, height: size, willChange: "transform" }}
        >
          <CubeFaces size={size} faces={faces} />
        </div>
      </div>
    </div>
  );
}
