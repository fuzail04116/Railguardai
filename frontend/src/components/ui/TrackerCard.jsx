/**
 * TrackerCard — Agent status tile with status indicator, risk score, and description.
 * Compact horizontal layout with animated status dot.
 */

const STATUS_STYLES = {
  idle: {
    dot: 'bg-guardian-500',
    label: 'Idle',
    labelColor: 'text-guardian-500',
    bg: 'bg-guardian-800/40',
    border: 'border-guardian-700/30',
  },
  running: {
    dot: 'bg-emerald-400 animate-pulse-dot',
    label: 'Active',
    labelColor: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
  },
  warning: {
    dot: 'bg-orange-400 animate-pulse',
    label: 'Escalating',
    labelColor: 'text-orange-400',
    bg: 'bg-orange-500/5',
    border: 'border-orange-500/20',
  },
  error: {
    dot: 'bg-red-400 animate-pulse',
    label: 'Critical',
    labelColor: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
  },
}

export function TrackerCard({ title, status = 'idle', value, valueLabel, description }) {
  const config = STATUS_STYLES[status] || STATUS_STYLES.idle

  return (
    <div
      className={`
        rounded-lg border p-3.5
        ${config.bg} ${config.border}
        transition-all duration-300
        hover:shadow-md
      `}
    >
      <div className="flex items-center justify-between mb-2">
        {/* Title with status dot */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
            {status !== 'idle' && (
              <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.dot} opacity-30 animate-ping`} />
            )}
          </div>
          <span className="text-xs font-semibold text-guardian-200">{title}</span>
        </div>

        {/* Status label */}
        <span className={`text-[10px] font-medium uppercase tracking-wider ${config.labelColor}`}>
          {config.label}
        </span>
      </div>

      {/* Value and description row */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-guardian-200">{value}</span>
          {valueLabel && (
            <span className="text-xs text-guardian-500 font-mono">{valueLabel}</span>
          )}
        </div>
      </div>

      {description && (
        <p className="text-[11px] text-guardian-400 mt-1.5 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
