/**
 * SOPCard — Enhanced Guardian AI Analytics Card
 * Warm light theme redesign.
 * 
 * Card face: Guardian recommendation + SOP + agent breakdown
 * Modal: Full incident report (styling updated, logic unchanged)
 */

import { DashboardCardModal } from './ui/DashboardCardModal'

/* ── Camera → Platform Mapping ── */
const PLATFORM_MAP = {
  'CAM_001': { platform: 'Platform 1', zone: 'North Entry', station: 'Central Junction' },
  'CAM_002': { platform: 'Platform 2', zone: 'Mid Section', station: 'Central Junction' },
  'CAM_003': { platform: 'Platform 3', zone: 'South Bay', station: 'Central Junction' },
  'CAM_004': { platform: 'Platform 4', zone: 'Foot Overbridge', station: 'Central Junction' },
}

const getPlatformInfo = (cameraId) => PLATFORM_MAP[cameraId] || { platform: `Platform ${cameraId?.slice(-1) || '?'}`, zone: 'General', station: 'Station' }

/* ── SOP Action Items ── */
const SOP_ACTIONS = {
  'SOP-CROWD-01': [
    'Close additional entry gates immediately',
    'Deploy RPF personnel to platform',
    'Announce platform change via PA system',
    'Monitor density via CCTV for 5-minute threshold',
  ],
  'SOP-CROWD-02': [
    'Escalate to Divisional Control immediately',
    'Consider holding train departure',
    'Initiate platform clearance procedure',
    'Document overcrowding duration in incident log',
  ],
  'SOP-SEC-01': [
    'RPF to cordon 15-metre radius around object',
    'Notify Bomb Detection Squad (Circular 47B)',
    'Do NOT touch or move the object',
    'Evacuate civilians from cordon zone',
  ],
  'SOP-SEC-02': [
    'Tag unattended baggage timestamp in CCTV system',
    'Relay live camera feed to RPF control room',
    'Maintain visual on object until RPF arrives',
    'Log incident in Station Security Register',
  ],
  'SOP-MED-01': [
    'Call station medical team: 1800-111-139',
    'Clear area around passenger',
    'Initiate first aid if trained personnel on site',
    'Alert train crew if near boarding zone',
  ],
  'SOP-MED-02': [
    'Log in Station Incident Register within 10 minutes',
    'Record: timestamp, platform number, train number',
    'Notify station master of medical emergency',
    'Arrange transport to nearest medical facility',
  ],
  'SOP-COMPOUND-01': [
    'Declare Platform Emergency Status',
    'Contact Divisional Security Control',
    'Suspend normal boarding operations',
    'Activate PA system for passenger guidance',
  ],
}

/* ── Warm Theme Style Constants ── */
const AGENT_CONFIG = {
  crowd: { icon: '👥', label: 'Crowd', color: '#185FA5', weight: '1.0×' },
  security: { icon: '🔒', label: 'Security', color: '#E67E22', weight: '2.0×' },
  distress: { icon: '🚨', label: 'Distress', color: '#C0392B', weight: '1.5×' },
}

function getRiskLevel(score) {
  if (score >= 8) return 'critical'
  if (score >= 6) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return 'Just now'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function getEscalationInfo(seconds, riskLevel) {
  if (!seconds || seconds === 0) return { level: 0, label: 'New', color: '#27AE60' }
  if (seconds < 30) return { level: 0, label: 'New', color: '#27AE60' }
  if (seconds <= 120) return { level: 1, label: 'Persistent', color: '#E67E22' }
  if (riskLevel === 'low') return { level: 2, label: 'Persistent', color: '#E67E22' }
  return { level: 2, label: 'Critical Duration', color: '#C0392B' }
}

function getScoreColor(score) {
  if (score >= 6) return '#C0392B'
  if (score >= 4) return '#E67E22'
  return '#27AE60'
}


export default function SOPCard({ alert }) {
  if (!alert) {
    return (
      <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.15 }}>🛡️</div>
          <p style={{ color: '#9C9690', fontSize: 13, fontWeight: 500 }}>Awaiting first incident detection...</p>
          <p style={{ color: '#9C9690', fontSize: 11, marginTop: 6 }}>
            The Guardian AI will analyze threats and recommend actions here
          </p>
        </div>
      </div>
    )
  }

  const platformInfo = getPlatformInfo(alert.camera_id)
  const escalation = getEscalationInfo(alert.duration_seconds, alert.risk_level)

  /* ── CARD FACE ── */
  const cardFace = (
    <div>
      {/* Eyebrow row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 12 }}>🛡️</span> Guardian Recommendation
        </p>
        {alert.sop_clause && (
          <span style={{
            fontFamily: "'SF Mono', ui-monospace, monospace", fontSize: 10, fontWeight: 600,
            background: '#E6F1FB', color: '#185FA5', padding: '3px 8px', borderRadius: 4,
          }}>
            {alert.sop_clause}
          </span>
        )}
      </div>

      {/* Recommendation text with left border */}
      <div style={{ borderLeft: '3px solid #C0392B', paddingLeft: 12, marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: '#1C1917', lineHeight: 1.7, margin: 0 }}>
          {alert.recommendation}
        </p>
      </div>

      {/* SOP reference block */}
      {alert.sop_text && (
        <div className="inner-block" style={{ marginBottom: 14 }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>SOP Reference</p>
          <p style={{ fontSize: 11, color: '#6B6560', lineHeight: 1.6, margin: 0 }}>
            {alert.sop_text}
          </p>
        </div>
      )}

      {/* Agent breakdown — 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {['crowd', 'security', 'distress'].map(k => {
          const data = alert.agent_outputs?.[k]
          const score = data?.risk_score ?? 0
          const cfg = AGENT_CONFIG[k]
          const scoreColor = getScoreColor(score)

          return (
            <div key={k} className="inner-block" style={{ padding: 10 }}>
              <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>{cfg.icon}</span> {cfg.label}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontSize: 24, fontWeight: 600, color: scoreColor }}>{score.toFixed(1)}</span>
                <span style={{ fontSize: 10, color: '#9C9690' }}>/10</span>
              </div>
              <p style={{ fontSize: 10, color: '#9C9690', margin: '3px 0 5px' }}>
                {data?.escalation ? 'Escalating' : 'Clear'}
              </p>
              <div style={{ height: 3, borderRadius: 2, background: '#EFEDE8', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2, width: `${Math.min(score * 10, 100)}%`,
                  background: scoreColor, transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#9C9690' }}>
          <span>⏱ {formatDuration(alert.duration_seconds)}</span>
          <span>📊 {alert.risk_score?.toFixed(1)}/10</span>
          <span style={{ color: escalation.color }}>● {escalation.label}</span>
        </div>
        <p style={{ fontSize: 10, color: '#185FA5', display: 'flex', alignItems: 'center', gap: 3 }}>
          View full report <span>→</span>
        </p>
      </div>
    </div>
  )

  /* ── MODAL BODY ── */
  const modalBody = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Section 1: Overview grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Risk Score */}
        <div className="inner-block" style={{ padding: 16 }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>Composite Risk Score</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: getScoreColor(alert.risk_score || 0) }}>
              {alert.risk_score?.toFixed(1)}
            </span>
            <span style={{ fontSize: 13, color: '#9C9690' }}>/ 10.0</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#EFEDE8', overflow: 'hidden', marginTop: 10 }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${Math.min((alert.risk_score || 0) * 10, 100)}%`,
              background: getScoreColor(alert.risk_score || 0),
              transition: 'width 0.5s',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: '#9C9690' }}>
            <span>0 Safe</span><span>4 Medium</span><span>6 High</span><span>8+ Critical</span>
          </div>
        </div>

        {/* Location */}
        <div className="inner-block" style={{ padding: 16 }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>Incident Location</p>
          {[
            ['Station', platformInfo.station],
            ['Platform', platformInfo.platform],
            ['Zone', platformInfo.zone],
            ['Camera', alert.camera_id],
            ['Duration', `${formatDuration(alert.duration_seconds)} (${escalation.label})`],
            ['Detected', alert.created_at ? new Date(alert.created_at).toLocaleString() : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#9C9690' }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#1C1917' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Recommendation */}
      <div style={{ borderLeft: '4px solid #C0392B', paddingLeft: 14, background: '#FDF6F5', borderRadius: '0 8px 8px 0', padding: '12px 14px 12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span>🛡️</span>
          <p className="eyebrow">Guardian AI Recommendation</p>
        </div>
        <p style={{ fontSize: 13, color: '#1C1917', lineHeight: 1.7, margin: 0 }}>
          {alert.recommendation}
        </p>
      </div>

      {/* Section 3: SOP Reference */}
      {alert.sop_clause && (
        <div style={{ border: '1px solid #DDD9D2', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ background: '#E6F1FB', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #D0E4F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📋</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SOP Reference: {alert.sop_clause}
              </span>
            </div>
            <span style={{ fontSize: 9, fontFamily: "'SF Mono', monospace", background: 'white', color: '#185FA5', padding: '3px 6px', borderRadius: 4 }}>
              Indian Railways Safety Protocol
            </span>
          </div>
          <div style={{ padding: 14 }}>
            {alert.sop_text && (
              <div className="inner-block" style={{ marginBottom: 12 }}>
                <p className="eyebrow" style={{ marginBottom: 4 }}>Clause Text</p>
                <p style={{ fontSize: 12, color: '#6B6560', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                  "{alert.sop_text}"
                </p>
              </div>
            )}
            {SOP_ACTIONS[alert.sop_clause] && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 8 }}>✅ Required Response Actions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SOP_ACTIONS[alert.sop_clause].map((action, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, border: '1px solid #D0E4F5',
                        background: '#F0F7FD', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 600, color: '#185FA5', flexShrink: 0,
                      }}>{i + 1}</div>
                      <p style={{ fontSize: 12, color: '#1C1917', lineHeight: 1.5, margin: 0 }}>{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!alert.sop_clause && (
        <div className="inner-block" style={{ padding: 14 }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>📋 SOP Reference</p>
          <p style={{ fontSize: 12, color: '#9C9690', margin: 0 }}>
            No specific SOP clause triggered. SOPs are retrieved when composite risk ≥ 4.0.
          </p>
        </div>
      )}

      {/* Section 4: Agent Analysis */}
      <div>
        <p className="eyebrow" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span>🤖 Agent Analysis Breakdown</span>
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            (C×1.0 + S×2.0 + D×1.5) ÷ 4.5
          </span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['crowd', 'security', 'distress'].map(k => {
            const data = alert.agent_outputs?.[k]
            const score = data?.risk_score ?? 0
            const cfg = AGENT_CONFIG[k]
            const sc = getScoreColor(score)
            return (
              <div key={k} className="inner-block" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{cfg.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1C1917' }}>{cfg.label}</span>
                    <span style={{ fontSize: 9, color: '#9C9690', background: '#EFEDE8', padding: '1px 4px', borderRadius: 3 }}>
                      {cfg.weight}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    {data?.escalation && (
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#E67E22', background: '#FFF3E0', padding: '2px 6px', borderRadius: 10, marginRight: 4 }}>
                        ⚠ Escalating
                      </span>
                    )}
                    <span style={{ fontSize: 18, fontWeight: 700, color: sc }}>{score.toFixed(1)}</span>
                    <span style={{ fontSize: 10, color: '#9C9690' }}>/10</span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#EFEDE8', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(score * 10, 100)}%`, background: sc, transition: 'width 0.5s' }} />
                </div>
                <p style={{ fontSize: 11, color: '#6B6560', lineHeight: 1.5, margin: 0 }}>
                  {data?.finding ?? 'No data available'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 5: Escalation Timeline */}
      <div className="inner-block" style={{ padding: 14 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>⏱ Temporal Escalation Status</p>
        <div style={{ display: 'flex', gap: 3 }}>
          {[
            { label: 'New (0-30s)', threshold: 30, color: '#27AE60' },
            { label: 'Persistent (30-120s)', threshold: 120, color: '#E67E22' },
            { label: 'Critical (>120s)', threshold: Infinity, color: '#C0392B' },
          ].map((stage, i) => {
            const d = alert.duration_seconds || 0
            const isActive = (i === 0 && d < 30) || (i === 1 && d >= 30 && d <= 120) || (i === 2 && d > 120)
            const isPast = (i === 0 && d >= 30) || (i === 1 && d > 120)
            return (
              <div key={i} style={{ flex: 1 }}>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: isActive ? stage.color : isPast ? `${stage.color}60` : '#DDD9D2',
                  transition: 'background 0.3s',
                }} />
                <p style={{ fontSize: 9, textAlign: 'center', marginTop: 3, color: isActive ? '#1C1917' : '#9C9690', fontWeight: isActive ? 600 : 400 }}>
                  {stage.label}
                </p>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 10, color: '#9C9690', textAlign: 'center', marginTop: 6 }}>
          Current: {formatDuration(alert.duration_seconds)} · Level: {escalation.level}/2 · <span style={{ color: escalation.color }}>{escalation.label}</span>
        </p>
      </div>

      {/* Section 6: Frame */}
      {alert.frame_url && (
        <div style={{ border: '1px solid #DDD9D2', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ background: '#F7F4EF', padding: '8px 14px', borderBottom: '1px solid #DDD9D2' }}>
            <p className="eyebrow">📸 Incident Frame Capture</p>
          </div>
          <img src={alert.frame_url} alt="Incident frame capture" style={{ width: '100%' }} />
        </div>
      )}

      {/* Footer grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {[
          ['Camera', alert.camera_id],
          ['Platform', platformInfo.platform],
          ['Type', alert.incident_type?.toUpperCase()],
          ['Status', alert.resolved ? '✓ Resolved' : '✗ Active'],
        ].map(([label, value]) => (
          <div key={label} className="inner-block" style={{ textAlign: 'center', padding: 8 }}>
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9C9690', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#1C1917', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <DashboardCardModal
      className="card h-full group"
      cardContent={cardFace}
      modalTitle={`Incident Report — ${alert.incident_type?.toUpperCase()} · ${platformInfo.platform} · Score ${alert.risk_score?.toFixed(1)}`}
      modalContent={modalBody}
    />
  )
}
