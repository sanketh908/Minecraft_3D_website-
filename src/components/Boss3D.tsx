"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls } from "@react-three/drei";
import { FBXLoader } from "three-stdlib";
import * as THREE from "three";

// The FBX files reference their textures by the exporter's original
// absolute Windows path (e.g. "E:\...\warden.png"), which obviously can't
// resolve in the browser — redirect each known filename to where we
// actually host it, so FBXLoader's own (correct) per-mesh material/UV
// assignments load with the right image instead of failing silently.
const TEXTURE_REDIRECTS: Record<string, string> = {
  "warden.png": "/models/warden/warden.png",
  "warden_heart.png": "/models/warden/warden_heart.png",
  "wither.png": "/models/wither/wither.png",
};

function useFbxWithTextures(path: string) {
  return useLoader(FBXLoader, path, (loader) => {
    loader.manager.setURLModifier((url) => {
      const filename = url.split(/[\\/]/).pop() ?? url;
      return TEXTURE_REDIRECTS[filename] ?? url;
    });
  });
}

// Fixes up whatever materials/textures FBXLoader already correctly wired
// per mesh — never *replaces* them. Reconstructing a single uniform
// material for every mesh (an earlier version of this component did that)
// is what caused each part to lose its own correct UV region and start
// sampling the wrong part of the sheet (e.g. the mouth texture showing up
// on a hand).
function preparePixelMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach((mat) => {
      if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhongMaterial)) return;
      mat.side = THREE.DoubleSide;
      // Preserving the FBX's own material (instead of replacing it, see
      // above) also inherits whatever transparency the exporter baked in —
      // some of these came through with alpha blending enabled, making
      // the whole mesh look see-through. Force fully opaque.
      mat.transparent = false;
      mat.opacity = 1;
      mat.depthWrite = true;
      for (const key of ["map", "emissiveMap"] as const) {
        const tex = mat[key];
        if (tex) {
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          tex.colorSpace = THREE.SRGBColorSpace;
          // Verified empirically (headless FBX parse + side-by-side render
          // comparison): these UVs expect the loader's default flipY=true.
          // An earlier attempt forced this to false to chase a different
          // bug and made it worse — every mesh sampled the wrong texture
          // row, rendering as near-solid black with only a couple of
          // bright patches instead of the actual bone/spot detail.
          tex.flipY = true;
          tex.needsUpdate = true;
        }
      }
      mat.needsUpdate = true;
    });
  });
}

type BossKind = "dragon" | "warden" | "wither";

// The GLB and the two FBX files were each authored at wildly different
// native scales (Sketchfab exports aren't unit-consistent across authors).
// Rather than hand-tune a magic scale/position per file, measure the real
// bounding box after load and normalize every model to the same on-screen
// size, centered at the origin — robust regardless of the source's units.
function Autofit({ children, target = 2.4 }: { children: ReactNode; target?: number }) {
  const ref = useRef<THREE.Group>(null);
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    // Reset to identity before measuring so this is idempotent — React's
    // dev-mode Strict Mode double-invokes effects, and without this reset
    // the second run measures the *already-fitted* (small) box and then
    // overwrites the correct scale with a wrong one.
    group.scale.set(1, 1, 1);
    group.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = target / maxDim;
    group.scale.setScalar(scale);
    group.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    setFitted(true);
  }, [target]);

  return (
    <group ref={ref} visible={fitted}>
      {children}
    </group>
  );
}

function DragonModel() {
  const { scene, animations } = useGLTF("/models/dragon.glb");
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    const first = Object.values(actions)[0];
    first?.reset().play();
    return () => {
      first?.stop();
    };
  }, [actions]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material.side = THREE.DoubleSide;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

function WardenModel() {
  const fbx = useFbxWithTextures("/models/warden/Warden.fbx");

  useEffect(() => {
    preparePixelMaterials(fbx);
  }, [fbx]);

  return <primitive object={fbx} />;
}

function WitherModel() {
  const fbx = useFbxWithTextures("/models/wither/Wither.fbx");

  useEffect(() => {
    preparePixelMaterials(fbx);
  }, [fbx]);

  return <primitive object={fbx} />;
}

function Spinner({ children, speed = 0.15 }: { children: ReactNode; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });
  return <group ref={ref}>{children}</group>;
}

const MODELS: Record<BossKind, () => React.ReactElement> = {
  dragon: DragonModel,
  warden: WardenModel,
  wither: WitherModel,
};

// Autofit normalizes by the single largest dimension, which undersells a
// wide, flat shape like the dragon (wingspan >> body height) next to a
// compact humanoid like the warden — same "largest edge" size, but far
// less visual mass. Give it a bigger target to compensate.
const FIT_TARGET: Record<BossKind, number> = { dragon: 3.6, warden: 2.4, wither: 2.4 };

const noopSubscribe = () => () => {};

export function Boss3D({ kind, size, spinSpeed = 0.15 }: { kind: BossKind; size: number; spinSpeed?: number }) {
  const Model = MODELS[kind];
  // OrbitControls sets touch-action:none on the canvas, which on a phone
  // turns the whole model into a dead zone the page can't scroll through —
  // only allow drag-to-orbit with a mouse/trackpad.
  const finePointer = useSyncExternalStore(
    noopSubscribe,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );
  // All three canvases mount at page load; rendering them every frame while
  // scrolled away (e.g. while playing the game at the bottom) is what ate the
  // phone's GPU. "demand" still draws the first frame (so shaders compile
  // behind the loading screen), then idles until it's back on screen.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={wrapRef}
      style={{ width: `min(${size}px * var(--s, 1), 100%)`, aspectRatio: "1" }}
      className={finePointer ? "touch-none" : ""}
    >
      <Canvas camera={{ position: [0, 0.3, 5], fov: 38 }} dpr={[1, 2]} frameloop={onScreen ? "always" : "demand"}>
        {/* drei's <Environment> fetches its HDRI from an external CDN,
            which is unreliable/blocked in this environment and throws an
            uncaught error that crashes the whole scene — every boss model
            rendering "broken" traced back to this, not to materials/UVs.
            A hemisphere light gives these dark matte skins the fill light
            they need to read any detail at all, but a warm/cool tinted one
            gave them an odd color-cast look — keep it strictly neutral
            (white sky, gray ground) so it's pure fill with no tint. */}
        <hemisphereLight args={["#ffffff", "#3a3a3a", 0.9]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} />
        <directionalLight position={[-4, -2, -3]} intensity={0.9} />
        <directionalLight position={[0, -3, 2]} intensity={0.55} />
        <Suspense fallback={null}>
          <Spinner speed={spinSpeed}>
            <Autofit target={FIT_TARGET[kind]}>
              <Model />
            </Autofit>
          </Spinner>
        </Suspense>
        {finePointer && <OrbitControls enableZoom={false} enablePan={false} makeDefault />}
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/dragon.glb");
