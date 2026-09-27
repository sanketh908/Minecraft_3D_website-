# Minecraft Fan Showcase

An unofficial, non-commercial Minecraft fan site: biomes, ores, bosses, a
player-build gallery and two mini games (Block Slash and Whack-a-Mob).

**NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.**

Built with Next.js 16, React 19, Tailwind CSS 4, GSAP, Lenis and react-three-fiber.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Deploy

The site is fully static-rendered and needs no environment variables or
database. Push the repo to GitHub and import it on [Vercel](https://vercel.com/new)
(zero config), or any host that runs `npm run build` + `npm start`.

## Legal

See the in-site [Privacy & Legal](src/app/legal/page.tsx) page (`/legal`).
Minecraft textures and imagery are © Mojang Studios / Microsoft and are used
under the [Minecraft Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines).
Keep the site free and ad-free to stay within them.
