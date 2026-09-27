function stepClipPath(steps: number) {
  const seg = 100 / steps;
  const points: string[] = ["0% 100%"];
  for (let i = 0; i <= steps; i++) {
    const x = i * seg;
    const y = i % 2 === 0 ? 0 : 58;
    points.push(`${x}% ${y}%`);
  }
  points.push("100% 100%");
  return `polygon(${points.join(", ")})`;
}

const CLIP = stepClipPath(20);

export function SteppedDivider({
  color,
  flip = false,
  className = "",
}: {
  color: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`h-7 w-full sm:h-10 ${className}`}
      style={{
        background: color,
        clipPath: CLIP,
        transform: flip ? "scaleY(-1)" : undefined,
      }}
    />
  );
}
