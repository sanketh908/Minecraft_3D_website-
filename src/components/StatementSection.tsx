import { SplitReveal } from "./SplitReveal";
import { ScrollParallax } from "./ScrollParallax";
import { AmbientMobHead } from "./AmbientMobHead";
import { SLIME_HEAD, ENDERMAN_HEAD } from "./MobHead";

export function StatementSection() {
  return (
    <section className="relative overflow-hidden bg-panel px-6 pb-20 pt-24 text-center sm:pt-32">
      <AmbientMobHead
        top="14%"
        left="8%"
        size={54}
        spec={SLIME_HEAD}
        name="slime"
        spinDuration={14}
        parallaxSpeed={0.3}
        reverse
        variant="sway"
      />
      <AmbientMobHead
        top="70%"
        left="88%"
        size={50}
        spec={ENDERMAN_HEAD}
        name="enderman"
        spinDuration={13}
        parallaxSpeed={0.4}
        variant="bob"
      />

      <ScrollParallax depth speed={0.15}>
        <SplitReveal
          as="p"
          className="font-display mx-auto max-w-4xl text-4xl uppercase leading-tight text-background sm:text-6xl md:text-7xl"
        >
          Build anything. Survive anything. The only limit is your{" "}
          <span className="inline-block bg-gold px-3 text-panel">imagination</span>.
        </SplitReveal>
      </ScrollParallax>
    </section>
  );
}
