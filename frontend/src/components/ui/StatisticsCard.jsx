/**
 * StatisticsCard — Glassmorphic metric card with trend indicator.
 * Shows a large value with suffix, label, and optional color coding.
 */

const COLOR_MAP = {
  low: { accent: 'text-emerald-400', bg: 'from-emerald-500/10 to-transparent', border: 'border-emerald-500/20' },
  medium: { accent: 'text-amber-400', bg: 'from-amber-500/10 to-transparent', border: 'border-amber-500/20' },
  high: { accent: 'text-orange-400', bg: 'from-orange-500/10 to-transparent', border: 'border-orange-500/20' },
  critical: { accent: 'text-red-400', bg: 'from-red-500/10 to-transparent', border: 'border-red-500/20' },
  default: { accent: 'text-accent-cyan', bg: 'from-accent-cyan/10 to-transparent', border: 'border-accent-cyan/20' },
}

const TREND_ICONS = {
  up: '↑',
  down: '↓',
  neutral: '—',
}

export function StatisticsCard({ label, value, suffix, trend = 'neutral', color }) {
  const colorConfig = COLOR_MAP[color] || COLOR_MAP.default

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border
        bg-gradient-to-br ${colorConfig.bg}
        ${colorConfig.border}
        glass p-5
        transition-all duration-300
        hover:scale-[1.02] hover:shadow-lg
        animate-fade-in
      `}
    >
      {/* Background shimmer on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />

      {/* Label */}
      <p className="text-[11px] font-medium uppercase tracking-widest text-guardian-400 mb-3">
        {label}
      </p>

      {/* Value row */}
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold font-mono ${colorConfig.accent} transition-colors duration-500`}>
          {value}
        </span>
        {suffix && (
          <span className="text-sm text-guardian-500 font-mono">{suffix}</span>
        )}
        {trend && trend !== 'neutral' && (
          <span className={`text-sm ml-auto ${trend === 'up' ? 'text-red-400' : 'text-emerald-400'}`}>
            {TREND_ICONS[trend]}
          </span>
        )}
      </div>
    </div>
  )
}
