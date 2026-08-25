const shape = [0.35, 0.72, 0.54, 1, 0.62, 0.46, 0.78];

export default function UsageBars({ value = 0 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 items-end gap-0.5" aria-hidden="true">
        {shape.map((ratio, index) => <span key={index} className="w-1.5 rounded-t-sm bg-primary/30" style={{ height: `${Math.max(3, ratio * 26 * (value / 100))}px` }} />)}
      </div>
      <span className="font-mono text-xs font-semibold">{value}%</span>
    </div>
  );
}