import Image from "next/image";
import { Block3D, type BlockFaces } from "./Block3D";
import { FloatingCube } from "./FloatingCube";
import { DoodleArrow } from "./DoodleArrow";
import { Reveal } from "./Reveal";
import { ScrollParallax } from "./ScrollParallax";
import { AmbientMobHead } from "./AmbientMobHead";
import { COW_HEAD, CREEPER_HEAD, SKELETON_HEAD, CHICKEN_HEAD } from "./MobHead";
import { HeroTitle } from "./HeroTitle";
import { ChevronDownIcon } from "./icons";

const uniform = (name: string): BlockFaces => ({
  top: `/images/blocks/${name}.png`,
  side: `/images/blocks/${name}.png`,
  bottom: `/images/blocks/${name}.png`,
});

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-svh w-full items-center overflow-hidden bg-gradient-to-b from-[#bfe3f7] to-background pt-20"
    >
      <ScrollParallax speed={0.15} className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/images/misc/hero-landscape.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </ScrollParallax>

      <ScrollParallax
        speed={0.5}
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] opacity-[0.07] mix-blend-multiply sm:h-[640px] sm:w-[640px]"
      >
        <Image src="/images/misc/creeper-logo.jpg" alt="" fill sizes="640px" loading="eager" className="object-contain" />
      </ScrollParallax>

      <FloatingCube top="22%" left="14%" size={28} faces={uniform("diamond_ore")} spinDuration={8} bobDuration={3.4} />
      <FloatingCube top="30%" left="88%" size={22} faces={uniform("glowstone")} spinDuration={7} bobDuration={3.2} reverse />
      <FloatingCube top="58%" left="92%" size={24} faces={uniform("emerald_ore")} spinDuration={9} bobDuration={3.8} reverse />
      <FloatingCube top="78%" left="10%" size={26} faces={uniform("amethyst_block")} spinDuration={10} bobDuration={4} />

      <AmbientMobHead
        top="70%"
        left="4%"
        size={54}
        spec={COW_HEAD}
        name="cow"
        spinDuration={14}
        parallaxSpeed={0.35}
      />
      <AmbientMobHead
        top="12%"
        left="92%"
        size={46}
        spec={CREEPER_HEAD}
        name="creeper"
        spinDuration={12}
        parallaxSpeed={0.3}
        variant="sway"
      />
      <AmbientMobHead
        top="80%"
        left="88%"
        size={42}
        spec={SKELETON_HEAD}
        name="skeleton"
        spinDuration={13}
        parallaxSpeed={0.4}
        reverse
      />
      <AmbientMobHead
        top="40%"
        left="95%"
        size={40}
        spec={CHICKEN_HEAD}
        name="chicken"
        spinDuration={11}
        parallaxSpeed={0.32}
        variant="bob"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <Reveal y={16} delay={0}>
            <p className="font-pixel text-[10px] uppercase tracking-widest text-grass-dark">Home</p>
          </Reveal>
          <HeroTitle />
          <Reveal y={14} delay={0.55}>
            <p className="font-hand mt-5 text-2xl text-grass-dark">One block at a time.</p>
          </Reveal>
          <Reveal y={16} delay={0.75} className="mt-8 flex items-start gap-2">
            <DoodleArrow className="mt-1 h-16 w-20 shrink-0 text-dirt-dark/70" />
            <p className="font-hand -mt-1 max-w-xs text-xl text-dirt-dark">
              &quot;You start enjoying life when you don&apos;t fear death.&quot;
            </p>
          </Reveal>
        </div>

        <ScrollParallax speed={0.35} depth className="flex items-center justify-center">
          <Reveal as="div" delay={0.3} y={30}>
            <Block3D size={260} />
          </Reveal>
        </ScrollParallax>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-foreground/40">
        <ChevronDownIcon className="h-7 w-7" />
      </div>
    </section>
  );
}
