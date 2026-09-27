import Image from "next/image";
import { Reveal } from "./Reveal";
import { GalleryTile } from "./GalleryTile";
import { AmbientMobHead } from "./AmbientMobHead";
import { SNOW_GOLEM_HEAD, SPIDER_HEAD } from "./MobHead";
import { HeartIcon } from "./icons";
import { builds } from "@/lib/builds";

export function Gallery() {
  return (
    <section id="about" className="relative mx-auto w-full max-w-6xl px-6 py-24">
      <AmbientMobHead
        top="4%"
        left="90%"
        size={52}
        spec={SNOW_GOLEM_HEAD}
        name="snow golem"
        spinDuration={14}
        parallaxSpeed={0.3}
      />
      <AmbientMobHead
        top="80%"
        left="6%"
        size={46}
        spec={SPIDER_HEAD}
        name="spider"
        spinDuration={12}
        parallaxSpeed={0.35}
        reverse
        variant="bob"
      />

      <Reveal className="mx-auto max-w-xl text-center" y={24}>
        <p className="font-pixel text-[10px] uppercase tracking-widest text-grass-dark">
          Our World
        </p>
        <h2 className="font-display mt-3 text-3xl uppercase text-foreground sm:text-4xl">
          Built By Players Like You
        </h2>
        <p className="mt-4 text-foreground/75">
          From a single blocky landscape to castles, redstone computers and
          entire cities built one cube at a time &mdash; every build here was
          made by someone with nothing but blocks and time.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {builds.map((build, i) => (
          <GalleryTile key={build.title} index={i}>
            <div className="group relative h-64 overflow-hidden sm:h-72">
              <Image
                src={build.image}
                alt={build.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                style={{ objectPosition: build.position ?? "center" }}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/0" />
              <div className="absolute right-3 top-3 flex items-center gap-1 bg-black/50 px-2 py-1 text-white">
                <HeartIcon className="h-3.5 w-3.5 text-lava" />
                <span className="font-pixel text-[9px]">{build.likes}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 transition-transform duration-300 ease-out group-hover:-translate-y-1">
                <h3 className="font-display text-lg uppercase text-white">{build.title}</h3>
                <p className="font-pixel mt-1 text-[9px] uppercase tracking-widest text-white/60">
                  {build.creator}
                </p>
              </div>
            </div>
          </GalleryTile>
        ))}
      </div>

      <Reveal className="relative mt-10 flex flex-col items-center gap-3" y={16} delay={0.1}>
        <div className="inline-flex items-center gap-2 border-2 border-dirt-dark/30 px-4 py-2">
          <span className="font-pixel text-[10px] uppercase tracking-widest text-dirt-dark">
            Player Since 2009
          </span>
        </div>
      </Reveal>
    </section>
  );
}
