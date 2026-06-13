/**
 * AnimatedStatusBadge — Animated pill badge showing current risk level.
 * Features pulsing dot indicator and color transitions per risk state.
 */

const STATUS_CONFIG = {
  low: {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/40',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
  },
  medium: {
    bg: 'bg-amber-950/60',
    border: 'border-amber-500/40',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  },
  high: {
    bg: 'bg-orange-950/60',
    border: 'border-orange-500/40',
    dot: 'bg-orange-400',
    text: 'text-orange-300',
    glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]',
  },
  critical: {
    bg: 'bg-red-950/60',
    border: 'border-red-500/50',
    dot: 'bg-red-400',
    text: 'text-red-300',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
  },
}

export function AnimatedStatusBadge({ status = 'low', label, camera }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.low
  const isCritical = status === 'critical'

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-full border
        transition-all duration-500 ease-out
        ${config.bg} ${config.border} ${config.glow}
        ${isCritical ? 'animate-border-glow' : ''}
      `}
    >
      {/* Pulsing dot */}
      <div className="relative flex items-center justify-center">
        <div className={`w-2.5 h-2.5 rounded-full ${config.dot} ${isCritical ? 'animate-pulse' : 'animate-pulse-dot'}`} />
        <div className={`absolute w-2.5 h-2.5 rounded-full ${config.dot} opacity-40 animate-ping`} />
      </div>

      {/* Label */}
      <div className="flex flex-col">
        <span className={`text-xs font-semibold tracking-wide uppercase ${config.text}`}>
          {label || `Risk: ${status.toUpperCase()}`}
        </span>
        {camera && (
          <span className="text-[10px] text-guardian-400 font-mono">{camera}</span>
        )}
      </div>
    </div>
  )
}
