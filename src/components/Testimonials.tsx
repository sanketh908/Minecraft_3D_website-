import { Reveal } from "./Reveal";
import { ScrollParallax } from "./ScrollParallax";
import { AmbientMobHead } from "./AmbientMobHead";
import { CREEPER_HEAD } from "./MobHead";
import { CrownIcon } from "./icons";

const quotes = [
  { text: "I JUST LOVE THIS GAME.", handle: "@DiamondMiner99" },
  { text: "BEST 3,000 HOURS OF MY LIFE.", handle: "@CraftyBuilder" },
  { text: "MY KID WON'T STOP BUILDING.", handle: "@ProudGamerParent" },
  { text: "REDSTONE IS MY LOVE LANGUAGE.", handle: "@CircuitSteve" },
  { text: "STILL SCARED OF CREEPERS.", handle: "@NervousNoob" },
  { text: "MY BASE HAS ITS OWN ZIP CODE.", handle: "@MegaBaseBuilder" },
];

function QuoteCard({ text, handle }: { text: string; handle: string }) {
  return (
    <div className="relative mx-3 flex h-56 w-72 shrink-0 flex-col justify-center gap-4 border-2 border-black/15 bg-background px-8 text-center shadow-sm">
      <span className="absolute left-4 top-3 h-2 w-2 rounded-full bg-black/40" />
      <span className="absolute right-4 top-3 h-2 w-2 rounded-full bg-black/40" />
      <span className="font-display text-3xl text-gold">&ldquo;&rdquo;</span>
      <p className="font-display text-lg uppercase leading-snug text-foreground">{text}</p>
      <p className="text-sm text-foreground/60">{handle}</p>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="relative w-full overflow-hidden bg-background py-20">
      <AmbientMobHead
        top="6%"
        left="8%"
        size={46}
        spec={CREEPER_HEAD}
        name="creeper"
        spinDuration={11}
        parallaxSpeed={0.3}
        variant="sway"
      />

      <Reveal className="mx-auto max-w-xl px-6 text-center" y={20}>
        <p className="font-pixel text-[10px] uppercase tracking-widest text-grass-dark">
          A Community Legend
        </p>
        <ScrollParallax depth speed={0.1}>
          <div className="mt-6 flex flex-col items-center gap-3 border-2 border-gold/40 bg-panel px-8 py-8 text-background">
            <CrownIcon className="h-7 w-7 text-gold" />
            <p className="font-display text-2xl uppercase sm:text-3xl">
              &ldquo;Technoblade never dies.&rdquo;
            </p>
            <p className="font-pixel text-[9px] uppercase tracking-widest text-background/50">
              In memory of Technoblade, 1999&ndash;2022
            </p>
          </div>
        </ScrollParallax>
      </Reveal>

      <Reveal className="mx-auto mt-16 max-w-xl px-6 text-center" y={20}>
        <p className="font-pixel text-[10px] uppercase tracking-widest text-grass-dark">
          Fan Shoutouts
        </p>
        <h2 className="font-display mt-3 text-3xl uppercase text-foreground sm:text-4xl">
          Loved Since 2009
        </h2>
      </Reveal>

      <div className="mt-12 overflow-hidden">
        <div className="animate-marquee flex w-max" style={{ animationDuration: "38s" }}>
          {[0, 1].map((rep) => (
            <div key={rep} className="flex shrink-0" aria-hidden={rep === 1}>
              {quotes.map((q) => (
                <QuoteCard key={q.handle} {...q} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
