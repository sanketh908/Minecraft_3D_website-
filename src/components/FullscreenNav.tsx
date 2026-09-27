"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { CloseIcon } from "./icons";
import { lockScroll, scrollToHash } from "./SmoothScroll";

const links = [
  { href: "/#top", label: "Home" },
  { href: "/#materials", label: "Materials" },
  { href: "/#biomes", label: "Biomes" },
  { href: "/#bosses", label: "Bosses" },
  { href: "/#about", label: "Gallery" },
  { href: "/#game", label: "Game" },
];

export function FullscreenNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const overlay = overlayRef.current;
    const linksEl = linksRef.current;
    if (!overlay || !linksEl) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The closed state on first mount isn't a "close" — unlocking scroll
    // there would release the loading screen's scroll lock.
    if (!open && !wasOpen.current) return;
    wasOpen.current = open;

    if (open) {
      lockScroll(true);
      overlay.style.display = "flex";
      if (reduced) {
        gsap.set(overlay, { clipPath: "circle(150% at 100% 0%)" });
        gsap.set(linksEl.children, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        overlay,
        { clipPath: "circle(0% at 100% 0%)" },
        { clipPath: "circle(150% at 100% 0%)", duration: 0.6, ease: "power3.inOut" },
      );
      gsap.fromTo(
        linksEl.children,
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, delay: 0.25, ease: "power3.out" },
      );
    } else {
      lockScroll(false);
      if (reduced) {
        overlay.style.display = "none";
        return;
      }
      gsap.to(overlay, {
        clipPath: "circle(0% at 100% 0%)",
        duration: 0.4,
        ease: "power3.in",
        onComplete: () => {
          overlay.style.display = "none";
        },
      });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 hidden flex-col items-center justify-center gap-8 bg-panel text-background"
      style={{ clipPath: "circle(0% at 100% 0%)" }}
    >
      <button
        onClick={onClose}
        aria-label="Close menu"
        className="absolute right-6 top-4 p-2 text-background transition-colors hover:text-gold"
      >
        <CloseIcon className="h-6 w-6" />
      </button>
      <div ref={linksRef} className="flex flex-col items-center gap-6 [@media(max-height:500px)]:gap-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => {
              e.preventDefault();
              onClose();
              lockScroll(false);
              scrollToHash(link.href.slice(1));
            }}
            className="font-display text-4xl uppercase transition-colors [@media(max-height:500px)]:text-3xl hover:text-gold sm:text-5xl"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
