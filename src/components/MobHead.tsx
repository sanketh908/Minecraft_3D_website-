import type { CSSProperties } from "react";

// Every Minecraft mob's head is its own box, not a uniform cube — a cow's
// head is wider than it is deep, a villager's is taller than it is wide,
// and a wolf's is actually TWO boxes (a skull plus a separate snout that
// sticks out in front of it, per Mojang's own model). These dimensions and
// offsets come straight from Mojang's entity geometry files, converted
// once from Minecraft's (right-handed, +y-up) model space into this
// renderer's (+y-down, +z-toward-viewer) box-face space.
type Box = { w: number; h: number; d: number };
type Offset = { x: number; y: number; z: number };
type FaceUV = { x: number; y: number; w: number; h: number };

export type SubBox = { box: Box; uv: { x: number; y: number }; offset?: Offset };

export type MobHeadSpec = {
  src: string;
  sheetW: number; // full sheet width in source pixels (64)
  sheetH: number; // full sheet height in source pixels (32 or 64)
  // One box for a simple mob (zombie, creeper, cow…); several for a mob
  // whose head is a compound shape (wolf's skull + snout).
  boxes: SubBox[];
  // Solid color composited under the texture so any transparent skin
  // pixels (fur/hair overlays, cutouts) show skin-tone instead of a
  // see-through "hole" to whatever is behind the page.
  fallback: string;
};

// Standard Minecraft cuboid UV unwrap for a box of size (w,h,d) placed at
// UV origin (ux,uy) — the same layout used for every vanilla entity cube.
function boxUV(box: Box, ux: number, uy: number): Record<"right" | "front" | "left" | "back" | "top" | "bottom", FaceUV> {
  const { w, h, d } = box;
  return {
    top: { x: ux + d, y: uy, w, h: d },
    bottom: { x: ux + d + w, y: uy, w, h: d },
    right: { x: ux, y: uy + d, w: d, h },
    front: { x: ux + d, y: uy + d, w, h },
    left: { x: ux + d + w, y: uy + d, w: d, h },
    back: { x: ux + 2 * d + w, y: uy + d, w, h },
  };
}

// Minecraft itself fakes directional light this way — top faces full
// bright, the two "north/south" side pairs a little dimmer, "east/west"
// dimmer still, bottom darkest. Applying the same per-face brightness here
// is what turns a flat, evenly-lit texture crop into something that reads
// as an actual lit 3D object instead of a flat sticker on a box.
const FACE_BRIGHTNESS = { top: 1.15, front: 0.85, back: 0.85, right: 0.65, left: 0.65, bottom: 0.5 } as const;

function shade(brightness: number) {
  const c = brightness < 1 ? `rgba(0,0,0,${(1 - brightness).toFixed(2)})` : `rgba(255,255,255,${((brightness - 1) * 0.7).toFixed(2)})`;
  return `linear-gradient(${c}, ${c})`;
}

function faceStyle(
  rotation: string,
  spec: MobHeadSpec,
  uv: FaceUV,
  unit: number,
  half: number,
  face: keyof typeof FACE_BRIGHTNESS,
): CSSProperties {
  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: uv.w * unit,
    height: uv.h * unit,
    backgroundColor: spec.fallback,
    // Shading is a flat color layer over the texture rather than a CSS
    // `filter: brightness()` — a filter on every face of every head/chest
    // (hundreds on the page) was a real paint cost on phones.
    backgroundImage: `${shade(FACE_BRIGHTNESS[face])}, url(${spec.src})`,
    backgroundSize: `100% 100%, ${spec.sheetW * unit}px ${spec.sheetH * unit}px`,
    backgroundPosition: `0 0, ${-uv.x * unit}px ${-uv.y * unit}px`,
    imageRendering: "pixelated",
    transform: `translate(-50%, -50%) ${rotation} translateZ(${half}px)`,
    border: "1px solid rgba(0,0,0,0.4)",
    backfaceVisibility: "hidden",
    willChange: "transform",
  };
}

function SubBoxFaces({ sub, spec, unit, center }: { sub: SubBox; spec: MobHeadSpec; unit: number; center: Offset }) {
  const { w, h, d } = sub.box;
  const off = sub.offset ?? { x: 0, y: 0, z: 0 };
  const uv = boxUV(sub.box, sub.uv.x, sub.uv.y);
  const tx = (off.x - center.x) * unit;
  const ty = (off.y - center.y) * unit;
  const tz = (off.z - center.z) * unit;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
        transform: `translate3d(${tx}px, ${ty}px, ${tz}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div style={faceStyle("rotateY(0deg)", spec, uv.front, unit, (d / 2) * unit, "front")} />
      <div style={faceStyle("rotateY(180deg)", spec, uv.back, unit, (d / 2) * unit, "back")} />
      <div style={faceStyle("rotateY(90deg)", spec, uv.right, unit, (w / 2) * unit, "right")} />
      <div style={faceStyle("rotateY(-90deg)", spec, uv.left, unit, (w / 2) * unit, "left")} />
      <div style={faceStyle("rotateX(90deg)", spec, uv.top, unit, (h / 2) * unit, "top")} />
      <div style={faceStyle("rotateX(-90deg)", spec, uv.bottom, unit, (h / 2) * unit, "bottom")} />
    </div>
  );
}

// `size` is the on-screen footprint in CSS px for the whole head's largest
// edge — every box scales off that so a tall (villager), shallow (cow), or
// two-piece (wolf) head keeps its real proportions and relative position.
export function MobHeadFaces({ size, spec }: { size: number; spec: MobHeadSpec }) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const sub of spec.boxes) {
    const off = sub.offset ?? { x: 0, y: 0, z: 0 };
    minX = Math.min(minX, off.x - sub.box.w / 2);
    maxX = Math.max(maxX, off.x + sub.box.w / 2);
    minY = Math.min(minY, off.y - sub.box.h / 2);
    maxY = Math.max(maxY, off.y + sub.box.h / 2);
    minZ = Math.min(minZ, off.z - sub.box.d / 2);
    maxZ = Math.max(maxZ, off.z + sub.box.d / 2);
  }
  const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const unit = size / extent;
  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };

  return (
    <>
      {spec.boxes.map((sub, i) => (
        <SubBoxFaces key={i} sub={sub} spec={spec} unit={unit} center={center} />
      ))}
    </>
  );
}

const single = (box: Box): SubBox[] => [{ box, uv: { x: 0, y: 0 } }];

export const CREEPER_HEAD: MobHeadSpec = {
  src: "/images/mobs/creeper.png",
  boxes: single({ w: 8, h: 8, d: 8 }),
  sheetW: 64,
  sheetH: 32,
  fallback: "#5a8f3c",
};
export const ZOMBIE_HEAD: MobHeadSpec = {
  src: "/images/mobs/zombie.png",
  boxes: single({ w: 8, h: 8, d: 8 }),
  sheetW: 64,
  sheetH: 64,
  fallback: "#4a7a4a",
};
export const SKELETON_HEAD: MobHeadSpec = {
  src: "/images/mobs/skeleton.png",
  boxes: single({ w: 8, h: 8, d: 8 }),
  sheetW: 64,
  sheetH: 32,
  fallback: "#c9c4b8",
};
export const COW_HEAD: MobHeadSpec = {
  src: "/images/mobs/cow.png",
  boxes: single({ w: 8, h: 8, d: 6 }),
  sheetW: 64,
  sheetH: 32,
  fallback: "#4a3728",
};
// Villager's big nose is its own protruding box, not part of the head cube.
export const VILLAGER_HEAD: MobHeadSpec = {
  src: "/images/mobs/villager.png",
  sheetW: 64,
  sheetH: 64,
  fallback: "#b98c65",
  boxes: [
    { box: { w: 8, h: 10, d: 8 }, uv: { x: 0, y: 0 } },
    { box: { w: 2, h: 4, d: 2 }, uv: { x: 24, y: 0 }, offset: { x: 0, y: 4, z: 5 } },
  ],
};
// Piglin's head has a protruding snout box plus two flat rectangular ears
// sticking out sideways — none of that is part of the main head cube.
export const PIGLIN_HEAD: MobHeadSpec = {
  src: "/images/mobs/piglin.png",
  sheetW: 64,
  sheetH: 64,
  fallback: "#c98a63",
  boxes: [
    { box: { w: 10, h: 8, d: 8 }, uv: { x: 0, y: 0 } },
    { box: { w: 4, h: 4, d: 1 }, uv: { x: 31, y: 1 }, offset: { x: 0, y: 2, z: 4.5 } },
    { box: { w: 1, h: 5, d: 4 }, uv: { x: 51, y: 6 }, offset: { x: 4.5, y: 0.5, z: 0 } },
    { box: { w: 1, h: 5, d: 4 }, uv: { x: 39, y: 6 }, offset: { x: -4.5, y: 0.5, z: 0 } },
  ],
};
export const SNOW_GOLEM_HEAD: MobHeadSpec = {
  src: "/images/mobs/snow_golem.png",
  boxes: single({ w: 8, h: 8, d: 8 }),
  sheetW: 64,
  sheetH: 64,
  fallback: "#eef5f4",
};
// Wolf's head is a compound shape: a 6x6x4 skull plus a 3x3x4 snout that
// sits slightly lower and sticks out in front of it, plus two small ears
// on top — rendering it as one box (the old approach) squashed the snout
// into the skull and lost the face entirely.
export const WOLF_HEAD: MobHeadSpec = {
  src: "/images/mobs/wolf.png",
  sheetW: 64,
  sheetH: 32,
  fallback: "#9c9384",
  boxes: [
    { box: { w: 6, h: 6, d: 4 }, uv: { x: 0, y: 0 } },
    { box: { w: 3, h: 3, d: 4 }, uv: { x: 0, y: 10 }, offset: { x: 0, y: 1.48, z: 3 } },
    { box: { w: 2, h: 2, d: 1 }, uv: { x: 16, y: 14 }, offset: { x: -2, y: -4, z: -0.5 } },
    { box: { w: 2, h: 2, d: 1 }, uv: { x: 16, y: 14 }, offset: { x: 2, y: -4, z: -0.5 } },
  ],
};
export const SPIDER_HEAD: MobHeadSpec = {
  src: "/images/mobs/spider.png",
  // The spider's head sits at (32, 4) on its sheet, not the usual (0, 0) —
  // reading (0, 0) textured it with a blank dark patch.
  boxes: [{ box: { w: 8, h: 8, d: 8 }, uv: { x: 32, y: 4 } }],
  sheetW: 64,
  sheetH: 32,
  fallback: "#1a1a1a",
};
export const SLIME_HEAD: MobHeadSpec = {
  src: "/images/mobs/slime.png",
  boxes: single({ w: 6, h: 6, d: 6 }),
  sheetW: 64,
  sheetH: 32,
  fallback: "#6fae3e",
};
export const ENDERMAN_HEAD: MobHeadSpec = {
  src: "/images/mobs/enderman.png",
  boxes: single({ w: 8, h: 8, d: 8 }),
  sheetW: 64,
  sheetH: 32,
  fallback: "#0d0d0d",
};
export const SHEEP_HEAD: MobHeadSpec = {
  src: "/images/mobs/sheep.png",
  boxes: single({ w: 6, h: 6, d: 8 }),
  sheetW: 64,
  sheetH: 32,
  fallback: "#d9d3c7",
};
// Pig's snout is its own small flat box stuck onto the front of the head
// cube, same idea as the villager's nose.
export const PIG_HEAD: MobHeadSpec = {
  src: "/images/mobs/pig.png",
  sheetW: 64,
  sheetH: 32,
  fallback: "#e8a2a0",
  boxes: [
    { box: { w: 8, h: 8, d: 8 }, uv: { x: 0, y: 0 } },
    { box: { w: 4, h: 3, d: 1 }, uv: { x: 16, y: 16 }, offset: { x: 0, y: 1.5, z: 4.5 } },
  ],
};
// Chicken's beak is its own box poking out past the head cube.
export const CHICKEN_HEAD: MobHeadSpec = {
  src: "/images/mobs/chicken.png",
  sheetW: 64,
  sheetH: 32,
  fallback: "#f2ede0",
  boxes: [
    { box: { w: 4, h: 6, d: 3 }, uv: { x: 0, y: 0 } },
    { box: { w: 4, h: 2, d: 2 }, uv: { x: 14, y: 0 }, offset: { x: 0, y: 0, z: 2.5 } },
  ],
};
