/**
 * RiskGauge — Custom SVG semicircle gauge for 0-10 risk score.
 * Animated arc stroke with color transitions per risk level.
 */

const COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

const GLOW_COLORS = {
  low: 'drop-shadow(0 0 6px rgba(16,185,129,0.4))',
  medium: 'drop-shadow(0 0 6px rgba(245,158,11,0.4))',
  high: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))',
  critical: 'drop-shadow(0 0 12px rgba(239,68,68,0.6))',
}

export default function RiskGauge({ score = 0, level = 'low' }) {
  const pct = Math.min(Math.max(score / 10, 0), 1) * 100
  const color = COLORS[level] || COLORS.low
  const glow = GLOW_COLORS[level] || GLOW_COLORS.low

  // Arc parameters
  const arcLength = 172.7 // Approximate length of the SVG arc path
  const dashArray = `${pct * arcLength / 100} ${arcLength}`

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 120 75"
        className="w-full max-w-[200px]"
        style={{ filter: glow }}
      >
        {/* Background arc */}
        <path
          d="M10 65 A55 55 0 0 1 110 65"
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = Math.PI - (tick / 100) * Math.PI
          const x1 = 60 + 48 * Math.cos(angle)
          const y1 = 65 - 48 * Math.sin(angle)
          const x2 = 60 + 55 * Math.cos(angle)
          const y2 = 65 - 55 * Math.sin(angle)
          return (
            <line
              key={tick}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#334155"
              strokeWidth="1"
            />
          )
        })}

        {/* Active arc */}
        <path
          d="M10 65 A55 55 0 0 1 110 65"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          style={{
            transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
          }}
        />

        {/* Score text */}
        <text
          x="60" y="55"
          textAnchor="middle"
          fill="white"
          fontSize="22"
          fontWeight="700"
          fontFamily="'JetBrains Mono', monospace"
        >
          {score.toFixed(1)}
        </text>

        {/* Scale labels */}
        <text x="12" y="74" fill="#475569" fontSize="7" fontFamily="'Inter', sans-serif">0</text>
        <text x="103" y="74" fill="#475569" fontSize="7" fontFamily="'Inter', sans-serif">10</text>
      </svg>

      {/* Level badge below gauge */}
      <div className="flex items-center gap-2 mt-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color }}
        >
          {level}
        </span>
      </div>
    </div>
  )
}
