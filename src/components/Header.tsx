"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "./icons";
import { FullscreenNav } from "./FullscreenNav";

// No solid background chip behind the logo/menu — they float directly over
// whatever section is scrolled underneath, so a light+dark halo (instead of a
// filled box) is what keeps them readable on both light and dark sections.
const HALO = "drop-shadow(0 0 3px rgba(255,255,255,0.75)) drop-shadow(0 1px 3px rgba(0,0,0,0.45))";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4">
        <Link href="/#top" className="flex items-center" style={{ filter: HALO }}>
          {/* A plain text wordmark, not Mojang's official logo artwork —
              the usage guidelines don't allow their logo on fan sites. */}
          <span className="font-minecraft text-lg uppercase leading-none text-foreground sm:text-xl">
            Minecraft <span className="font-pixel text-[9px] uppercase tracking-widest text-grass-dark">Fan Site</span>
          </span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-70"
          style={{ filter: HALO }}
        >
          <MenuIcon className="h-4 w-4" />
          <span className="font-pixel text-[10px] uppercase tracking-widest">Menu</span>
        </button>
      </header>
      <FullscreenNav open={open} onClose={() => setOpen(false)} />
    </>
  );
}
