import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & Legal — Unofficial Minecraft Fan Showcase",
  description: "Privacy notice, trademark disclaimer and content credits for this unofficial Minecraft fan site.",
};

const DISCLAIMER =
  "NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.";

export default function LegalPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-20">
      <Link href="/" className="font-pixel text-[10px] uppercase tracking-widest text-grass-dark hover:underline">
        &larr; Back to the site
      </Link>
      <h1 className="font-display mt-6 text-4xl uppercase sm:text-5xl">Privacy &amp; Legal</h1>
      <p className="mt-3 text-sm text-foreground/60">Last updated September 27, 2026</p>

      <Section title="Unofficial fan project">
        <p className="font-semibold">{DISCLAIMER}</p>
        <p>
          This is a free, non-commercial fan site made by Sanketh. Minecraft, the Minecraft name, and all
          related names, textures, characters and imagery are trademarks and property of Mojang Synergies
          AB and Microsoft. They are used here only to celebrate the game, as described in Mojang&apos;s{" "}
          <a
            href="https://www.minecraft.net/en-us/usage-guidelines"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Minecraft Usage Guidelines
          </a>
          . Nothing on this site is for sale, and the site shows no ads.
        </p>
      </Section>

      <Section title="Privacy">
        <p>
          This site does not collect, store or sell any personal information. It sets no cookies, uses no
          analytics or tracking, and has no accounts or forms. Game scores exist only in your browser tab
          and disappear when you leave.
        </p>
        <p>
          Like any website, the hosting provider may automatically keep standard server logs (such as IP
          address, browser type and time of visit) for security and reliability. Those logs are handled by
          the host under its own privacy policy and are not used by this site for anything else.
        </p>
      </Section>

      <Section title="Content credits">
        <p>
          Block, item, mob and chest textures are from Minecraft, &copy; Mojang Studios. Other images, 3D
          models and fonts belong to their respective creators and are used for non-commercial fan purposes.
        </p>
      </Section>

      <Section title="Removal requests">
        <p>
          If you own something shown here and would like it credited differently or removed, email{" "}
          <a href="mailto:sankeths908@gmail.com" className="underline">
            sankeths908@gmail.com
          </a>{" "}
          and it will be taken care of promptly.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl uppercase">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}
