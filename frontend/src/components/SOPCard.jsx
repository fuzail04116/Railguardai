/**
 * SOPCard — Enhanced Guardian AI Analytics Card
 * 
 * Card face: Risk summary + recommendation + platform info
 * Modal: Full incident report with:
 *   - Risk score visualization with gradient bar
 *   - Platform & camera identification
 *   - SOP clause with compliance checklist
 *   - Agent analysis with visual progress bars
 *   - Escalation timeline
 *   - Recommended response actions
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

/* ── Style Constants ── */
const BORDER_COLORS = {
  low: 'border-emerald-500/30',
  medium: 'border-amber-500/40',
  high: 'border-orange-500/50',
  critical: 'border-red-500/60 animate-border-glow',
}

const LEVEL_BADGES = {
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const SCORE_COLORS = {
  low: { bar: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/30' },
  medium: { bar: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/30' },
  high: { bar: 'bg-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/30' },
  critical: { bar: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/30' },
}

const AGENT_CONFIG = {
  crowd: { icon: '👥', label: 'Crowd Intelligence', color: 'bg-cyan-500', textColor: 'text-cyan-400', weight: '1.0×' },
  security: { icon: '🔒', label: 'Security Threat', color: 'bg-orange-500', textColor: 'text-orange-400', weight: '2.0×' },
  distress: { icon: '🚨', label: 'Passenger Welfare', color: 'bg-red-500', textColor: 'text-red-400', weight: '1.5×' },
}

/* ── Helper: Get risk level from score ── */
function getRiskLevel(score) {
  if (score >= 8) return 'critical'
  if (score >= 6) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

/* ── Helper: Format duration ── */
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return 'Just now'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

/* ── Helper: Get escalation label ── */
function getEscalationInfo(seconds, riskLevel) {
  if (!seconds || seconds === 0) return { level: 0, label: 'New', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  if (seconds < 30) return { level: 0, label: 'New', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  if (seconds <= 120) return { level: 1, label: 'Persistent', color: 'text-amber-400', bg: 'bg-amber-500/10' }
  // Escalation level 2 — but only show "Critical Duration" if risk is medium or above
  if (riskLevel === 'low') {
    return { level: 2, label: 'Persistent', color: 'text-amber-400', bg: 'bg-amber-500/10' }
  }
  return { level: 2, label: 'Critical Duration', color: 'text-red-400', bg: 'bg-red-500/10' }
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function SOPCard({ alert }) {
  if (!alert) {
    return (
      <div className="glass rounded-xl border border-guardian-700/30 h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-20">🛡️</div>
          <p className="text-guardian-500 text-sm font-medium">Awaiting first incident detection...</p>
          <p className="text-guardian-600 text-[11px] mt-2">
            The Guardian AI will analyze threats and recommend actions here
          </p>
        </div>
      </div>
    )
  }

  const borderColor = BORDER_COLORS[alert.risk_level] || BORDER_COLORS.low
  const levelBadge = LEVEL_BADGES[alert.risk_level] || LEVEL_BADGES.low
  const scoreColor = SCORE_COLORS[alert.risk_level] || SCORE_COLORS.low
  const platformInfo = getPlatformInfo(alert.camera_id)
  const escalation = getEscalationInfo(alert.duration_seconds, alert.risk_level)

  /* ── CARD FACE (collapsed) ── */
  const cardFace = (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-lg">🛡️</div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-400">
            Guardian Recommendation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {alert.sop_clause && (
            <span className="text-[10px] font-mono font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30 px-2 py-1 rounded-md">
              {alert.sop_clause}
            </span>
          )}
          <span className={`text-[10px] font-semibold uppercase border px-2 py-1 rounded-md ${levelBadge}`}>
            {alert.risk_level}
          </span>
        </div>
      </div>

      {/* Platform + Camera badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono bg-guardian-700/50 text-guardian-300 px-2 py-1 rounded border border-guardian-600/30">
          🚉 {platformInfo.platform}
        </span>
        <span className="text-[10px] font-mono bg-guardian-700/50 text-guardian-300 px-2 py-1 rounded border border-guardian-600/30">
          📷 {alert.camera_id}
        </span>
        <span className="text-[10px] font-mono bg-guardian-700/50 text-guardian-300 px-2 py-1 rounded border border-guardian-600/30">
          📍 {platformInfo.zone}
        </span>
      </div>

      {/* Recommendation text */}
      <p className="text-guardian-200 text-sm leading-relaxed mb-4">
        {alert.recommendation}
      </p>

      {/* Mini agent scores bar */}
      <div className="flex items-center gap-3 mb-4">
        {['crowd', 'security', 'distress'].map(k => {
          const data = alert.agent_outputs?.[k]
          const score = data?.risk_score ?? 0
          const cfg = AGENT_CONFIG[k]
          return (
            <div key={k} className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-wider text-guardian-500">{cfg.icon} {k}</span>
                <span className="text-[10px] font-mono font-bold text-guardian-300">{score.toFixed(1)}</span>
              </div>
              <div className="h-1.5 bg-guardian-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cfg.color} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.min(score * 10, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Metadata row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-guardian-500 font-mono">
          <span>⏱ {formatDuration(alert.duration_seconds)}</span>
          <span>📊 {alert.risk_score?.toFixed(1)}/10</span>
          <span className={`${escalation.color}`}>● {escalation.label}</span>
        </div>
        <p className="text-accent-cyan text-[10px] flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <span>View full report</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </p>
      </div>
    </div>
  )

  /* ── MODAL BODY (expanded) ── */
  const modalBody = (
    <div className="space-y-6">

      {/* ── Section 1: Incident Overview ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Risk Score Visual */}
        <div className="bg-guardian-800/50 rounded-xl p-4 border border-guardian-700/30">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 mb-3">
            Composite Risk Score
          </p>
          <div className="flex items-end gap-3">
            <span className={`text-4xl font-bold font-mono ${scoreColor.text}`}>
              {alert.risk_score?.toFixed(1)}
            </span>
            <span className="text-guardian-500 text-sm font-mono mb-1">/ 10.0</span>
          </div>
          {/* Score bar */}
          <div className="mt-3 h-2.5 bg-guardian-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreColor.bar} transition-all duration-1000 ease-out shadow-lg ${scoreColor.glow}`}
              style={{ width: `${Math.min((alert.risk_score || 0) * 10, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] text-guardian-600 font-mono">
            <span>0 Safe</span>
            <span>4 Medium</span>
            <span>6 High</span>
            <span>8 Critical</span>
            <span>10</span>
          </div>
        </div>

        {/* Location & Timing */}
        <div className="bg-guardian-800/50 rounded-xl p-4 border border-guardian-700/30">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 mb-3">
            Incident Location
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-guardian-400">Station</span>
              <span className="text-[11px] font-semibold text-guardian-200">{platformInfo.station}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-guardian-400">Platform</span>
              <span className="text-[11px] font-semibold text-guardian-200 bg-accent-cyan/10 text-accent-cyan px-2 py-0.5 rounded">
                🚉 {platformInfo.platform}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-guardian-400">Zone</span>
              <span className="text-[11px] font-semibold text-guardian-200">{platformInfo.zone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-guardian-400">Camera</span>
              <span className="text-[11px] font-mono text-guardian-300">{alert.camera_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-guardian-400">Duration</span>
              <span className={`text-[11px] font-semibold ${escalation.color}`}>
                {formatDuration(alert.duration_seconds)} ({escalation.label})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-guardian-400">Detected</span>
              <span className="text-[11px] font-mono text-guardian-300">
                {alert.created_at ? new Date(alert.created_at).toLocaleString() : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Guardian Recommendation ── */}
      <div className={`rounded-xl p-4 border-l-4 ${
        alert.risk_level === 'critical' ? 'border-l-red-500 bg-red-500/5' :
        alert.risk_level === 'high' ? 'border-l-orange-500 bg-orange-500/5' :
        'border-l-accent-cyan bg-accent-cyan/5'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🛡️</span>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-400">
            Guardian AI Recommendation
          </p>
          <span className={`ml-auto text-[9px] font-bold uppercase px-2 py-0.5 rounded ${levelBadge}`}>
            {alert.risk_level} Priority
          </span>
        </div>
        <p className="text-guardian-200 text-sm leading-relaxed">
          {alert.recommendation}
        </p>
      </div>

      {/* ── Section 3: SOP Reference ── */}
      {alert.sop_clause && (
        <div className="rounded-xl border border-accent-blue/20 overflow-hidden">
          {/* SOP Header */}
          <div className="bg-accent-blue/10 px-4 py-3 flex items-center justify-between border-b border-accent-blue/20">
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <span className="text-[11px] font-bold text-accent-blue uppercase tracking-wide">
                SOP Reference: {alert.sop_clause}
              </span>
            </div>
            <span className="text-[9px] font-mono bg-accent-blue/20 text-accent-blue px-2 py-1 rounded-md border border-accent-blue/30">
              Indian Railways Safety Protocol
            </span>
          </div>

          {/* SOP Text */}
          <div className="p-4">
            {alert.sop_text && (
              <div className="bg-guardian-800/30 rounded-lg p-3 mb-4 border border-guardian-700/30">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 mb-1.5">
                  Clause Text
                </p>
                <p className="text-guardian-200 text-[13px] leading-relaxed italic">
                  "{alert.sop_text}"
                </p>
              </div>
            )}

            {/* Action Items Checklist */}
            {SOP_ACTIONS[alert.sop_clause] && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 mb-2.5 flex items-center gap-1.5">
                  <span>✅</span> Required Response Actions
                </p>
                <div className="space-y-2">
                  {SOP_ACTIONS[alert.sop_clause].map((action, i) => (
                    <div key={i} className="flex items-start gap-2.5 group">
                      <div className="mt-0.5 w-5 h-5 rounded border border-accent-blue/40 bg-accent-blue/5 flex items-center justify-center shrink-0 group-hover:bg-accent-blue/20 transition-colors">
                        <span className="text-[10px] font-bold text-accent-blue">{i + 1}</span>
                      </div>
                      <p className="text-[12px] text-guardian-300 leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SOP Compliance Info */}
            <div className="mt-4 pt-3 border-t border-guardian-700/30 grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-guardian-600 mb-1">Authority</p>
                <p className="text-[11px] font-semibold text-guardian-300">RPF / Station Master</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-guardian-600 mb-1">Response Time</p>
                <p className="text-[11px] font-semibold text-amber-400">Immediate</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-guardian-600 mb-1">Log Required</p>
                <p className="text-[11px] font-semibold text-guardian-300">Within 10 min</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If no SOP clause, show a note */}
      {!alert.sop_clause && (
        <div className="rounded-xl border border-guardian-700/30 bg-guardian-800/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📋</span>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500">
              SOP Reference
            </p>
          </div>
          <p className="text-guardian-400 text-[12px]">
            No specific SOP clause triggered for this risk level. SOPs are retrieved when composite risk score ≥ 4.0.
          </p>
        </div>
      )}

      {/* ── Section 4: Agent Analysis Breakdown ── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 mb-3 flex items-center gap-1.5">
          <span>🤖</span> Agent Analysis Breakdown
          <span className="ml-auto text-[9px] text-guardian-600 font-normal normal-case">
            Weighted formula: (C×1.0 + S×2.0 + D×1.5) ÷ 4.5
          </span>
        </p>
        <div className="space-y-3">
          {['crowd', 'security', 'distress'].map(k => {
            const data = alert.agent_outputs?.[k]
            const score = data?.risk_score ?? 0
            const cfg = AGENT_CONFIG[k]
            const level = getRiskLevel(score)
            const levelColor = SCORE_COLORS[level]

            return (
              <div key={k} className="bg-guardian-800/50 rounded-xl p-4 border border-guardian-700/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cfg.icon}</span>
                    <span className="text-[11px] font-semibold text-guardian-200">{cfg.label}</span>
                    <span className="text-[9px] font-mono text-guardian-600 bg-guardian-700/50 px-1.5 py-0.5 rounded">
                      weight: {cfg.weight}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {data?.escalation && (
                      <span className="text-[9px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/30">
                        ⚠ Escalating
                      </span>
                    )}
                    <span className={`text-xl font-bold font-mono ${levelColor.text}`}>
                      {score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-guardian-500 font-mono">/ 10</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-2 bg-guardian-900 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${cfg.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min(score * 10, 100)}%` }}
                  />
                </div>

                {/* Finding */}
                <p className="text-[11px] text-guardian-400 leading-relaxed">
                  {data?.finding ?? 'No data available'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section 5: Escalation Timeline ── */}
      <div className="rounded-xl border border-guardian-700/30 bg-guardian-800/30 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 mb-3 flex items-center gap-1.5">
          <span>⏱</span> Temporal Escalation Status
        </p>
        <div className="flex items-center gap-1">
          {/* Three-stage escalation bar */}
          {[
            { label: 'New (0-30s)', threshold: 30 },
            { label: 'Persistent (30-120s)', threshold: 120 },
            { label: 'Critical (>120s)', threshold: Infinity },
          ].map((stage, i) => {
            const duration = alert.duration_seconds || 0
            const isActive = (i === 0 && duration < 30) || (i === 1 && duration >= 30 && duration <= 120) || (i === 2 && duration > 120)
            const isPast = (i === 0 && duration >= 30) || (i === 1 && duration > 120)
            return (
              <div key={i} className="flex-1">
                <div className={`h-2 rounded-full transition-all duration-500 ${
                  isActive ? (i === 2 ? 'bg-red-500 animate-pulse' : i === 1 ? 'bg-amber-500' : 'bg-emerald-500') :
                  isPast ? (i === 0 ? 'bg-emerald-500/50' : 'bg-amber-500/50') :
                  'bg-guardian-700'
                }`} />
                <p className={`text-[9px] mt-1 text-center ${isActive ? 'text-guardian-300 font-semibold' : 'text-guardian-600'}`}>
                  {stage.label}
                </p>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-guardian-500 mt-2 text-center font-mono">
          Current: {formatDuration(alert.duration_seconds)} · Escalation Level: {escalation.level}/2 · Status: <span className={escalation.color}>{escalation.label}</span>
        </p>
      </div>

      {/* ── Section 6: Incident Frame ── */}
      {alert.frame_url && (
        <div className="rounded-xl border border-guardian-700/30 overflow-hidden">
          <div className="bg-guardian-800/50 px-4 py-2.5 border-b border-guardian-700/30">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 flex items-center gap-1.5">
              <span>📸</span> Incident Frame Capture
            </p>
          </div>
          <img
            src={alert.frame_url}
            alt="Incident frame capture"
            className="w-full"
          />
        </div>
      )}

      {/* ── Footer Metadata ── */}
      <div className="bg-guardian-800/20 rounded-lg p-3 grid grid-cols-4 gap-3 text-center border border-guardian-700/20">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-guardian-600 mb-0.5">Camera</p>
          <p className="text-[11px] font-mono font-semibold text-guardian-300">{alert.camera_id}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-guardian-600 mb-0.5">Platform</p>
          <p className="text-[11px] font-mono font-semibold text-accent-cyan">{platformInfo.platform}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-guardian-600 mb-0.5">Incident Type</p>
          <p className="text-[11px] font-mono font-semibold text-guardian-300 uppercase">{alert.incident_type}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-guardian-600 mb-0.5">Resolved</p>
          <p className={`text-[11px] font-semibold ${alert.resolved ? 'text-emerald-400' : 'text-red-400'}`}>
            {alert.resolved ? '✓ Yes' : '✗ Active'}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardCardModal
      className={`glass rounded-xl border-2 ${borderColor} h-full group ${alert.risk_level === 'critical' ? 'scan-effect' : ''}`}
      cardContent={cardFace}
      modalTitle={`Incident Report — ${alert.incident_type?.toUpperCase()} · ${platformInfo.platform} · Score ${alert.risk_score?.toFixed(1)}`}
      modalContent={modalBody}
    />
  )
}
