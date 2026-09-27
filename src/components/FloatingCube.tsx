import { CubeFaces, type BlockFaces } from "./Block3D";
import { scaled, scaleInner } from "@/lib/scale";
import { MobHeadFaces, type MobHeadSpec } from "./MobHead";

export type FloatingCubeProps = {
  size: number;
  faces?: BlockFaces;
  mobHead?: MobHeadSpec;
  top: string;
  left: string;
  spinDuration: number;
  bobDuration: number;
  bobDelay?: number;
  reverse?: boolean;
};

export function FloatingCube({
  size,
  faces,
  mobHead,
  top,
  left,
  spinDuration,
  bobDuration,
  bobDelay = 0,
  reverse,
}: FloatingCubeProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        top,
        left,
        width: scaled(size),
        height: scaled(size),
        animation: `cube-float ${bobDuration}s ease-in-out ${bobDelay}s infinite`,
      }}
    >
      <div className="[perspective:600px]" style={scaleInner(size)}>
        <div
          className="relative h-full w-full [transform-style:preserve-3d]"
          style={{
            animation: `spin-slow ${spinDuration}s linear infinite`,
            animationDirection: reverse ? "reverse" : "normal",
            willChange: "transform",
          }}
        >
          {mobHead ? (
            <MobHeadFaces size={size} spec={mobHead} />
          ) : faces ? (
            <CubeFaces size={size} faces={faces} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
