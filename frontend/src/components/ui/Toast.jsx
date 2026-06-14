/**
 * Toast — Notification toast for incoming alerts.
 * Warm light theme — white card with colored left border.
 */

const VARIANT_STYLES = {
  destructive: { border: '#C0392B', bg: '#FDF6F5' },
  warning: { border: '#E67E22', bg: '#FFF8F0' },
  default: { border: '#185FA5', bg: '#F0F7FD' },
}

export function Toast({ title, description, variant = 'default', onDismiss }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.default

  return (
    <div
      className="animate-slide-in"
      style={{
        background: style.bg, borderLeft: `3px solid ${style.border}`,
        borderRadius: '0 8px 8px 0', padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)', maxWidth: 340,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#1C1917', margin: 0, marginBottom: 2 }}>
          {title}
        </p>
        {description && (
          <p style={{ fontSize: 10, color: '#6B6560', lineHeight: 1.4, margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent', border: 'none', color: '#9C9690',
            fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
