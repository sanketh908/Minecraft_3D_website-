import type { Metadata } from "next";
import { Inter, Anton, Silkscreen, Patrick_Hand } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const minecraftFont = localFont({
  src: "../fonts/Minecraft.ttf",
  variable: "--font-minecraft",
  display: "swap",
});

const enchantFont = localFont({
  src: "../fonts/Enchantment.ttf",
  variable: "--font-enchant",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Build Anything. Survive Everything. — An Unofficial Minecraft Fan Showcase",
  description:
    "An unofficial fan showcase of Minecraft: biomes, materials, and the block-by-block features that make the world of Minecraft what it is.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${anton.variable} ${silkscreen.variable} ${patrickHand.variable} ${minecraftFont.variable} ${enchantFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Screen-size scale factor for the 3D blocks/heads/bosses (see
            lib/scale.ts), plus the loading screen's scroll lock — both
            before any app code, so an early scroll can't slip through.
            The Preloader releases the lock. */}
        <Script id="screen-scale" strategy="beforeInteractive">
          {`(function(){var d=document.documentElement;if(location.pathname==="/")d.style.overflow="hidden";function f(){d.style.setProperty("--s",Math.min(1.6,Math.max(0.5,Math.min(innerWidth,innerHeight)/900)))}f();addEventListener("resize",f)})()`}
        </Script>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
