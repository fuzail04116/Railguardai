/**
 * AgentStatusRow — Three agent cards for crowd/security/distress agents.
 * Light theme with white cards, status badges, progress bars.
 */

const AGENTS = [
  { key: 'crowd',    label: 'Crowd Agent',    icon: '👥' },
  { key: 'security', label: 'Security Agent', icon: '🔒' },
  { key: 'distress', label: 'Distress Agent', icon: '🚨' },
]

const BADGE_STYLES = {
  idle:    { bg: '#EFEDE8', color: '#9C9690', label: 'Idle' },
  running: { bg: '#EAF3DE', color: '#3B6D11', label: 'Active' },
  warning: { bg: '#FFF3E0', color: '#BF6900', label: 'Escalating' },
  error:   { bg: '#FCE8E8', color: '#A32D2D', label: 'Critical' },
}

const BAR_COLORS = {
  idle: '#DDD9D2',
  running: '#27AE60',
  warning: '#E67E22',
  error: '#C0392B',
}

export default function AgentStatusRow({ outputs }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p className="eyebrow" style={{ marginBottom: 2, marginTop: 4 }}>Agent Status</p>
      {AGENTS.map(({ key, label, icon }) => {
        const data = outputs?.[key]
        const hasData = data && data.risk_score !== undefined

        let status = 'idle'
        if (hasData) {
          if (data.escalation) {
            status = data.risk_score >= 7 ? 'error' : 'warning'
          } else {
            status = 'running'
          }
        }

        const badge = BADGE_STYLES[status]
        const barColor = BAR_COLORS[status]
        const score = hasData ? data.risk_score : 0
        const finding = hasData ? data.finding : 'Awaiting detection data...'

        return (
          <div key={key} style={{
            background: 'white', border: '1px solid #DDD9D2', borderRadius: 8,
            padding: '8px 10px',
          }}>
            {/* Agent name + badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12 }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#1C1917' }}>{label}</span>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                background: badge.bg, color: badge.color, textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {badge.label}
              </span>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#1C1917' }}>
                {hasData ? score.toFixed(1) : '—'}
              </span>
              <span style={{ fontSize: 10, color: '#9C9690' }}>/10</span>
            </div>

            {/* Finding */}
            <p style={{ fontSize: 10, color: '#9C9690', margin: '3px 0 5px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {finding}
            </p>

            {/* Progress bar */}
            <div style={{ height: 3, borderRadius: 2, background: '#EFEDE8', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${(score / 10) * 100}%`,
                background: barColor,
                transition: 'width 0.5s ease, background 0.3s',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
