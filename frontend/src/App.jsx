import { useState } from 'react'
import { useAlerts } from './hooks/useAlerts'
import RiskGauge from './components/RiskGauge'
import SOPCard from './components/SOPCard'
import AgentStatusRow from './components/AgentStatusRow'
import SimulateButton from './components/SimulateButton'
import InputCenter from './components/InputCenter'

import { AnimatedStatusBadge } from './components/ui/AnimatedStatusBadge'
import { NotificationCenter } from './components/ui/NotificationCenter'
import { StatisticsCard } from './components/ui/StatisticsCard'
import { TableComponent } from './components/ui/TableComponent'
import { Toast } from './components/ui/Toast'

const PLATFORM_MAP = {
  'CAM_001': 'Platform 1',
  'CAM_002': 'Platform 2',
  'CAM_003': 'Platform 3',
  'CAM_004': 'Platform 4',
}
const getPlatform = (camId) => PLATFORM_MAP[camId] || `Platform ${camId?.slice(-1) || '?'}`

/* Nav icons as simple SVG-ish text */
const NAV_ITEMS = [
  { id: 'monitor', icon: '◫', label: 'Monitor' },
  { id: 'history', icon: '◷', label: 'History' },
  { id: 'analyze', icon: '△', label: 'Analyze' },
  { id: 'log', icon: '☰', label: 'Log' },
]

export default function App() {
  const { alerts, latestAlert, toastQueue, dismissToast, pushAlert, isConnected } = useAlerts()
  const [activeTab, setActiveTab] = useState('monitor')

  const badgeState = latestAlert?.risk_level ?? 'low'
  const activeIncidents = alerts.filter(a => !a.resolved).length
  const criticalCount = alerts.filter(a => a.risk_level === 'critical' || a.risk_level === 'high').length
  const avgRisk = alerts.length
    ? (alerts.slice(0, 10).reduce((s, a) => s + (a.risk_score || 0), 0) / Math.min(alerts.length, 10)).toFixed(1)
    : '0.0'

  const riskColor = badgeState === 'critical' || badgeState === 'high' ? '#C0392B'
    : badgeState === 'medium' ? '#E67E22' : '#27AE60'

  const incidentTitle = latestAlert
    ? `${(latestAlert.incident_type || 'Monitoring').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} — ${getPlatform(latestAlert.camera_id)}`
    : 'All Clear — Monitoring'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F7F4EF' }}>
      {/* Toast Layer */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5">
        {toastQueue.map(t => (
          <Toast
            key={t._toastId}
            title={`${t.risk_level?.toUpperCase()} — ${t.incident_type?.toUpperCase()} · ${getPlatform(t.camera_id)}`}
            description={t.recommendation?.slice(0, 100) + '...'}
            variant={t.risk_level === 'critical' ? 'destructive' : 'warning'}
            onDismiss={() => dismissToast(t._toastId)}
          />
        ))}
      </div>

      {/* ═══ ICON SIDEBAR (52px) ═══ */}
      <div style={{
        width: 52, minWidth: 52, background: '#1C1917',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 14, paddingBottom: 14, gap: 4,
      }}>
        {/* Logo */}
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: '#C0392B',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 14, marginBottom: 16,
        }}>🛡</div>

        {/* Nav icons */}
        {NAV_ITEMS.map(nav => (
          <button
            key={nav.id}
            onClick={() => setActiveTab(nav.id)}
            title={nav.label}
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: activeTab === nav.id ? '#2E2A27' : 'transparent',
              color: activeTab === nav.id ? '#F7F4EF' : '#6B6560',
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >{nav.icon}</button>
        ))}

        <div style={{ flex: 1 }} />
        {/* Settings icon at bottom */}
        <button style={{
          width: 34, height: 34, borderRadius: 8, border: 'none',
          background: 'transparent', color: '#6B6560', fontSize: 14,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>⚙</button>
      </div>

      {/* ═══ LEFT PANEL (200px) ═══ */}
      <div style={{
        width: 200, minWidth: 200, background: '#EFEDE8',
        borderRight: '1px solid #DDD9D2', padding: '18px 14px',
        display: 'flex', flexDirection: 'column', gap: 14,
        overflowY: 'auto',
      }}>
        {/* Wordmark */}
        <div style={{ marginBottom: 4 }}>
          <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 15, lineHeight: 1.2, color: '#1C1917', margin: 0 }}>
            Railway<br />Guardian <span style={{ color: '#C0392B' }}>AI</span>
          </p>
          <p style={{ fontSize: 10, color: '#9C9690', marginTop: 4, letterSpacing: '0.02em' }}>
            Safety Command · Indian Railways
          </p>
        </div>

        {/* Risk Score Block */}
        <div style={{
          background: '#1C1917', borderRadius: 10, padding: 14,
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560', marginBottom: 8 }}>Risk Score</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 52, color: 'white', lineHeight: 0.9 }}>
              {latestAlert?.risk_score?.toFixed(1) ?? '0.0'}
            </span>
            <span style={{ fontSize: 13, color: '#6B6560' }}>/10</span>
          </div>

          {/* Dot segments */}
          <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i < Math.round(latestAlert?.risk_score ?? 0) ? riskColor : '#2E2A27',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: riskColor, textTransform: 'capitalize' }}>
              {badgeState}
            </span>
            <span style={{ fontSize: 9, color: '#6B6560' }}>Avg 10: {avgRisk}</span>
          </div>
        </div>

        {/* Agent Status */}
        <AgentStatusRow outputs={latestAlert?.agent_outputs} />

        {/* Camera pills */}
        <div>
          <p className="eyebrow" style={{ marginBottom: 6, marginTop: 4 }}>Cameras</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(PLATFORM_MAP).map(([cam, plat]) => {
              const camAlert = alerts.find(a => a.camera_id === cam && !a.resolved)
              const levelColor = camAlert?.risk_level === 'high' || camAlert?.risk_level === 'critical' ? '#C0392B'
                : camAlert?.risk_level === 'medium' ? '#E67E22' : '#27AE60'
              return (
                <div key={cam} style={{
                  fontSize: 10, background: 'white', border: '1px solid #DDD9D2',
                  borderRadius: 20, padding: '3px 8px',
                  color: '#6B6560', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {cam.slice(-3)}
                  <span style={{ fontWeight: 600, color: levelColor, fontSize: 9 }}>
                    {camAlert?.risk_level?.slice(0, 3).toUpperCase() || 'OK'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #DDD9D2',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: '#1C1917', margin: 0 }}>
              {incidentTitle}
            </h1>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {latestAlert && (
                <>
                  <span style={{ fontSize: 10, background: '#EFEDE8', color: '#6B6560', padding: '2px 8px', borderRadius: 4 }}>
                    {latestAlert.camera_id}
                  </span>
                  <span style={{ fontSize: 10, background: '#EFEDE8', color: '#6B6560', padding: '2px 8px', borderRadius: 4 }}>
                    {getPlatform(latestAlert.camera_id)}
                  </span>
                  {latestAlert.duration_seconds > 0 && (
                    <span style={{ fontSize: 10, background: '#EFEDE8', color: '#6B6560', padding: '2px 8px', borderRadius: 4 }}>
                      {latestAlert.duration_seconds}s duration
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Live badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: isConnected ? '#EAF3DE' : '#EFEDE8',
              padding: '4px 10px', borderRadius: 20, fontSize: 11,
              color: isConnected ? '#3B6D11' : '#9C9690', fontWeight: 500,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isConnected ? '#27AE60' : '#9C9690',
              }} className={isConnected ? 'animate-pulse-dot' : ''} />
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <SimulateButton onResult={(alert) => pushAlert(alert)} />
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

          {/* ── MONITOR TAB ── */}
          {activeTab === 'monitor' && (
            <div style={{ display: 'flex', gap: 16, height: '100%' }}>
              {/* Left content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SOPCard alert={latestAlert} />
              </div>

              {/* Right sidebar (220px) */}
              <div style={{ width: 220, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Active incidents */}
                <div className="card" style={{ padding: 14 }}>
                  <p className="eyebrow" style={{ marginBottom: 6 }}>Active Incidents</p>
                  <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: '#C0392B', margin: 0, lineHeight: 1 }}>
                    {activeIncidents}
                  </p>
                  <p style={{ fontSize: 10, color: '#9C9690', marginTop: 4 }}>
                    {criticalCount} High+ this session
                  </p>
                </div>

                {/* Temporal escalation */}
                <div style={{ background: '#1C1917', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560', marginBottom: 8 }}>
                    Temporal Escalation
                  </p>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#27AE60' }} />
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E67E22' }} />
                    <div style={{ flex: 2, height: 6, borderRadius: 3, background: latestAlert?.duration_seconds > 120 ? '#C0392B' : '#2E2A27' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6B6560' }}>
                    <span>New</span><span>Persistent</span><span>Critical</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#C0392B' }}>
                      {latestAlert?.duration_seconds ?? 0}s
                    </span>
                    <span style={{ fontSize: 10, color: '#6B6560', marginLeft: 6 }}>
                      {latestAlert?.duration_seconds > 120 ? 'Critical' : latestAlert?.duration_seconds > 30 ? 'Persistent' : 'New'}
                    </span>
                  </div>
                </div>

                {/* Live alerts feed */}
                <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <NotificationCenter
                    cardTitle="Live Alerts"
                    cardDescription=""
                    notifications={alerts.slice(0, 10).map(a => ({
                      id: a.id,
                      title: `${a.incident_type?.toUpperCase()} · ${getPlatform(a.camera_id)}`,
                      description: `${a.recommendation?.slice(0, 50) || ''}...`,
                      time: new Date(a.created_at).toLocaleTimeString(),
                      variant: a.risk_level,
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: 14, borderBottom: '1px solid #DDD9D2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p className="eyebrow">Incident History</p>
                    <p style={{ fontSize: 10, color: '#9C9690', marginTop: 2 }}>Duration column confirms temporal escalation</p>
                  </div>
                  <span style={{ fontSize: 10, color: '#9C9690' }}>{alerts.length} records</span>
                </div>
              </div>
              <TableComponent
                columns={[
                  { key: 'created_at', label: 'Time', render: v => v ? new Date(v).toLocaleTimeString() : '—' },
                  { id: 'platform', key: 'camera_id', label: 'Platform', render: (v) => getPlatform(v) },
                  { key: 'camera_id', label: 'Camera' },
                  { key: 'incident_type', label: 'Type' },
                  { key: 'risk_level', label: 'Level' },
                  { key: 'risk_score', label: 'Score', render: v => v?.toFixed(1) ?? '—' },
                  { key: 'duration_seconds', label: 'Duration', render: v => v != null ? `${v}s` : '—' },
                  { key: 'sop_clause', label: 'SOP Cited', render: v => v || '—' },
                ]}
                rows={alerts}
              />
            </div>
          )}

          {/* ── ANALYZE TAB ── */}
          {activeTab === 'analyze' && (
            <div style={{ maxWidth: 600 }}>
              <InputCenter onResult={(alert) => pushAlert(alert)} />
            </div>
          )}

          {/* ── LOG TAB ── */}
          {activeTab === 'log' && (
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="card" style={{ flex: 1, overflow: 'hidden' }}>
                <NotificationCenter
                  cardTitle="Full Incident Log"
                  cardDescription="Complete alert feed from Supabase realtime"
                  notifications={alerts.map(a => ({
                    id: a.id,
                    title: `${a.incident_type?.toUpperCase()} · ${getPlatform(a.camera_id)}`,
                    description: `[${a.camera_id}] ${a.recommendation?.slice(0, 80) || ''}...`,
                    time: new Date(a.created_at).toLocaleTimeString(),
                    variant: a.risk_level,
                  }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav tabs */}
        <div style={{
          padding: '6px 20px', borderTop: '1px solid #DDD9D2',
          display: 'flex', gap: 4, background: '#F7F4EF', flexShrink: 0,
        }}>
          {[{ id: 'monitor', icon: '◫', label: 'Monitor' }, { id: 'history', icon: '◷', label: 'History' },
            { id: 'analyze', icon: '△', label: 'Analyze' }, { id: 'log', icon: '☰', label: 'Incident Log' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontSize: 11, fontWeight: activeTab === tab.id ? 500 : 400,
                padding: '7px 14px', borderRadius: 6, border: 'none',
                background: activeTab === tab.id ? 'white' : 'transparent',
                boxShadow: activeTab === tab.id ? '0 0 0 1px #DDD9D2' : 'none',
                color: activeTab === tab.id ? '#1C1917' : '#9C9690',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 13 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
