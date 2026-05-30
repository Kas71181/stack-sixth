export default function AuditScoreRing({ score }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Good" : score >= 50 ? "Fair" : "Poor";
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="144" height="144">
          <circle cx="72" cy="72" r={r} stroke="#e5e7eb" strokeWidth="10" fill="none" />
          <circle cx="72" cy="72" r={r} stroke={color} strokeWidth="10" fill="none"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
        </svg>
        <div className="text-center">
          <p className="text-4xl font-extrabold" style={{ color }}>{score}</p>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Audit Score</p>
    </div>
  );
}