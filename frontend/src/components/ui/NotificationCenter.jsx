/**
 * NotificationCenter — Scrollable live alert feed panel.
 * Displays notification items with risk-level colored borders and timestamps.
 */

const VARIANT_STYLES = {
  low: 'border-l-emerald-500 bg-emerald-500/5',
  medium: 'border-l-amber-500 bg-amber-500/5',
  high: 'border-l-orange-500 bg-orange-500/5',
  critical: 'border-l-red-500 bg-red-500/5',
}

const VARIANT_DOT = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-400',
  critical: 'bg-red-400',
}

export function NotificationCenter({ cardTitle, cardDescription, notifications = [] }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-guardian-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
          <p className="text-xs font-semibold uppercase tracking-widest text-guardian-300">
            {cardTitle || 'Live Alerts'}
          </p>
        </div>
        {cardDescription && (
          <p className="text-[10px] text-guardian-500 mt-1">{cardDescription}</p>
        )}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto max-h-[360px] p-2 space-y-1.5">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-guardian-600 text-xs">
            <div className="text-center">
              <div className="text-2xl mb-2 opacity-30">📡</div>
              <p>Awaiting incidents...</p>
              <p className="text-[10px] mt-1 text-guardian-700">Real-time feed active</p>
            </div>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id || i}
              className={`
                border-l-2 rounded-r-lg px-3 py-2.5
                ${VARIANT_STYLES[n.variant] || VARIANT_STYLES.low}
                animate-fade-in
                transition-all duration-200 hover:bg-guardian-700/30
              `}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${VARIANT_DOT[n.variant] || VARIANT_DOT.low}`} />
                    <p className="text-xs font-semibold text-guardian-200 truncate">
                      {n.title}
                    </p>
                  </div>
                  <p className="text-[11px] text-guardian-400 leading-relaxed line-clamp-2">
                    {n.description}
                  </p>
                </div>
                <span className="text-[10px] text-guardian-500 font-mono whitespace-nowrap shrink-0">
                  {n.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-guardian-700/50">
          <p className="text-[10px] text-guardian-600 text-center">
            Showing {notifications.length} recent alerts
          </p>
        </div>
      )}
    </div>
  )
}
