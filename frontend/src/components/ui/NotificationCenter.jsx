/**
 * NotificationCenter — Scrollable live alert feed panel.
 * Warm light theme — dot indicators, divider lines.
 */

const VARIANT_DOT = {
  low: '#27AE60',
  medium: '#E67E22',
  high: '#C0392B',
  critical: '#C0392B',
}

export function NotificationCenter({ cardTitle, cardDescription, notifications = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #EFEDE8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11 }}>📡</span>
          <p className="eyebrow" style={{ margin: 0 }}>
            {cardTitle || 'Live Alerts'}
          </p>
        </div>
        {cardDescription && (
          <p style={{ fontSize: 10, color: '#9C9690', marginTop: 2 }}>{cardDescription}</p>
        )}
      </div>

      {/* Notification list */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320, padding: '4px 0' }}>
        {notifications.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: '#9C9690', fontSize: 11 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.3 }}>📡</div>
              <p style={{ margin: 0 }}>Awaiting incidents...</p>
              <p style={{ fontSize: 10, marginTop: 3, color: '#DDD9D2' }}>Real-time feed active</p>
            </div>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id || i}
              className="animate-fade-in"
              style={{
                padding: '8px 14px',
                borderBottom: i < notifications.length - 1 ? '1px solid #EFEDE8' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F7F4EF'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: VARIANT_DOT[n.variant] || VARIANT_DOT.low,
                      flexShrink: 0,
                    }} />
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#1C1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.title}
                    </p>
                  </div>
                  <p style={{ fontSize: 10, color: '#9C9690', lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.description}
                  </p>
                </div>
                <span style={{ fontSize: 10, color: '#9C9690', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {n.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{ padding: '6px 14px', borderTop: '1px solid #EFEDE8', textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#9C9690', margin: 0 }}>
            {notifications.length} recent alerts
          </p>
        </div>
      )}
    </div>
  )
}
