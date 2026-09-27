import { Preloader } from "@/components/Preloader";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MarqueeBar } from "@/components/MarqueeBar";
import { Materials } from "@/components/Materials";
import { SteppedDivider } from "@/components/SteppedDivider";
import { StatementSection } from "@/components/StatementSection";
import { Biomes } from "@/components/Biomes";
import { Bosses } from "@/components/Bosses";
import { Gallery } from "@/components/Gallery";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";

const tickerItems = [
  "CREEPER",
  "DIAMOND",
  "ENDER DRAGON",
  "REDSTONE",
  "NETHERITE",
  "OBSIDIAN",
  "ENCHANTING TABLE",
  "VILLAGER",
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Preloader />
      <Header />
      <main className="flex flex-1 flex-col">
        <Hero />
        <MarqueeBar items={tickerItems} className="border-y-2 border-black/10 bg-background py-4" />
        <Materials />
        <SteppedDivider color="var(--panel)" />
        <StatementSection />
        <Biomes />
        <Bosses />
        <SteppedDivider color="var(--background)" />
        <Gallery />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
