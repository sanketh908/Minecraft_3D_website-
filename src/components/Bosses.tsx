import { BossSection } from "./BossSection";
import { BossesIntro } from "./BossesIntro";

export function Bosses() {
  return (
    <>
      <div id="bosses">
        <BossesIntro />
      </div>
      <BossSection
        name="Ender Dragon"
        tag="The End · Final Boss"
        glow="#b968f0"
        kind="dragon"
        spinSpeed={0.12}
        stats={[
          { label: "Health", value: "200 HP" },
          { label: "Attack", value: "10 HP (wing hit)" },
          { label: "Special", value: "Breath attack, ignores armor" },
          { label: "Found In", value: "The End" },
          { label: "Drops", value: "Dragon egg + 12,000 XP" },
        ]}
        fact="200 health and the true final boss — beat it once and the game rolls its actual ending credits."
        strategy="Destroy the End crystals on the obsidian towers first — they heal the dragon every time it perches, so it never runs out of health until they're gone."
      />
      <BossSection
        name="Wither"
        tag="Nether · Player-Summoned"
        glow="#8b95a3"
        kind="wither"
        spinSpeed={0.16}
        stats={[
          { label: "Health", value: "300 HP" },
          { label: "Attack", value: "8 HP (wither skull)" },
          { label: "Special", value: "Wither armor below half HP" },
          { label: "Summoned With", value: "Soul sand + 3 skulls" },
          { label: "Drops", value: "Nether star" },
        ]}
        fact="The only boss you build yourself — and the only mob in the game that can break obsidian."
        strategy="Fight it underground with a low ceiling — it can't fire skulls through blocks, and trapping it limits how far it can fly and destroy terrain."
      />
      <BossSection
        name="Warden"
        tag="Deep Dark · Ambush Predator"
        glow="#4fd1c5"
        kind="warden"
        spinSpeed={0.14}
        stats={[
          { label: "Health", value: "500 HP" },
          { label: "Attack", value: "30 HP (melee)" },
          { label: "Special", value: "Sonic boom, ignores armor" },
          { label: "Triggered By", value: "4 sculk shrieker pulses" },
          { label: "Drops", value: "None — pure combat" },
        ]}
        fact="Completely blind and hunts purely by sound — its own designers call it a force of nature to flee, not a boss to fight."
        strategy="Don't fight it — it can't see you. Crouch, avoid stepping on sculk sensors, and throw a projectile far away to distract it while you slip past."
      />
    </>
  );
}
