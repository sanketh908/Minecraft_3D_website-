import Link from "next/link";
import { Reveal } from "./Reveal";
import { ScrollParallax } from "./ScrollParallax";
import { AmbientMobHead } from "./AmbientMobHead";
import { PIGLIN_HEAD, SHEEP_HEAD } from "./MobHead";
import { Games } from "./Games";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-panel px-6 pb-10 pt-20 text-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "url('/images/misc/creeper-logo.jpg')",
          backgroundSize: "110px 110px",
          backgroundRepeat: "repeat",
        }}
      />

      <AmbientMobHead top="8%" left="6%" size={54} spec={PIGLIN_HEAD} name="piglin" spinDuration={14} parallaxSpeed={0.3} />
      <AmbientMobHead
        top="12%"
        left="92%"
        size={48}
        spec={SHEEP_HEAD}
        name="sheep"
        spinDuration={15}
        parallaxSpeed={0.4}
        reverse
        variant="sway"
      />

      {/* Wider than the rest of the footer's max-w-6xl on purpose — the
          game reads better with more horizontal room. Not wrapped in
          <Reveal>: it's the last real content on the page, so a "top 85%"
          scroll-in trigger like the credits below never fires here either;
          MineGame handles its own reveal (the curtain) on its own trigger. */}
      <div className="relative mx-auto w-full max-w-[90rem]">
        <Games />
      </div>

      <ScrollParallax speed={0.35} className="relative mt-16 overflow-hidden text-center">
        <Reveal y={20}>
          <p className="font-display select-none text-[16vw] uppercase leading-none text-background/10 sm:text-[11vw]">
            MINECRAFT
          </p>
        </Reveal>
      </ScrollParallax>

      {/* Plain div, not Reveal: this sits at the very bottom of the page,
          where there's no scroll room left to push it past Reveal's "top
          85%" trigger threshold, so its scroll-in animation never fires. */}
      <div className="relative mx-auto -mt-4 flex max-w-2xl flex-col items-center gap-3 text-center sm:-mt-8">
        {/* Mojang's own required wording for unofficial fan work. */}
        <p className="max-w-md text-sm font-semibold text-background/70">
          NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.
        </p>
        <p className="max-w-md text-sm text-background/60">
          A free, non-commercial fan showcase. Minecraft and its textures, mobs and
          imagery are trademarks and property of Mojang Studios and Microsoft.
        </p>
        <p className="font-pixel text-[9px] uppercase tracking-widest text-background/40">
          Fan Project &middot; Not For Sale &middot;{" "}
          <Link href="/legal" className="underline hover:text-background/70">
            Privacy &amp; Legal
          </Link>
        </p>
        <p className="font-pixel text-[9px] uppercase tracking-widest text-background/50">
          &copy; {new Date().getFullYear()} Sanketh
        </p>
      </div>
    </footer>
  );
}
