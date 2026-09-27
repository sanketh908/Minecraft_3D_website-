export function MarqueeBar({
  items,
  duration = 24,
  className = "",
}: {
  items: string[];
  duration?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="animate-marquee flex w-max"
        style={{ animationDuration: `${duration}s` }}
      >
        {[0, 1].map((rep) => (
          <div key={rep} className="flex shrink-0 items-center" aria-hidden={rep === 1}>
            {items.map((item, i) => (
              <span
                key={i}
                className="font-display flex items-center px-6 text-2xl uppercase tracking-wide sm:text-3xl"
              >
                {item}
                <span className="ml-6 text-gold">&#9670;</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
