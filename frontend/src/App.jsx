/**
 * Railway Guardian AI — Main Dashboard
 * Multi-Agent Safety Command Center for Indian Railways
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────┐
 * │  Header: Title + Status Badge + Simulate Button         │
 * ├─────────────────────────────────────────────────────────┤
 * │  Stats Row: Risk Score | Active Incidents | Critical     │
 * ├──────────────┬──────────────────────────────────────────┤
 * │  Risk Gauge  │  SOP Recommendation Card (expandable)    │
 * │  Agent Status│                                          │
 * ├──────────────┼──────────────────────────────────────────┤
 * │  Live Alerts │  Incident History Table                   │
 * └──────────────┴──────────────────────────────────────────┘
 */

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

/* Camera → Platform mapping */
const PLATFORM_MAP = {
  'CAM_001': 'Platform 1',
  'CAM_002': 'Platform 2',
  'CAM_003': 'Platform 3',
  'CAM_004': 'Platform 4',
}
const getPlatform = (camId) => PLATFORM_MAP[camId] || `Platform ${camId?.slice(-1) || '?'}`

export default function App() {
  const { alerts, latestAlert, toastQueue, dismissToast, pushAlert, isConnected } = useAlerts()

  // Derived stats
  const badgeState = latestAlert?.risk_level ?? 'low'
  const activeIncidents = alerts.filter(a => !a.resolved).length
  const criticalCount = alerts.filter(a => a.risk_level === 'critical' || a.risk_level === 'high').length
  const avgRisk = alerts.length
    ? (alerts.slice(0, 10).reduce((s, a) => s + (a.risk_score || 0), 0) / Math.min(alerts.length, 10)).toFixed(1)
    : '0.0'

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* ── Toast Layer ── */}
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

      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="flex items-center gap-4">
          {/* Logo mark */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-accent-cyan/20">
            🛡️
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Railway Guardian <span className="text-glow-cyan text-accent-cyan">AI</span>
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-guardian-500 text-[11px] font-medium tracking-wide">
                Multi-Agent Safety Command Center
              </p>
              <span className="text-guardian-700">·</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse-dot' : 'bg-guardian-600'}`} />
                <span className={`text-[10px] font-mono ${isConnected ? 'text-emerald-500' : 'text-guardian-600'}`}>
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatedStatusBadge
            status={badgeState}
            label={`Risk: ${badgeState.toUpperCase()}`}
            camera={latestAlert?.camera_id ?? 'No data'}
          />
          <SimulateButton onResult={(alert) => pushAlert(alert)} />
        </div>
      </header>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatisticsCard
          label="Current Risk Score"
          value={latestAlert?.risk_score?.toFixed(1) ?? '—'}
          suffix="/ 10"
          trend={latestAlert?.risk_score > 5 ? 'up' : 'neutral'}
          color={latestAlert?.risk_level}
        />
        <StatisticsCard
          label="Active Incidents"
          value={activeIncidents}
          suffix="open"
          trend={activeIncidents > 3 ? 'up' : 'neutral'}
          color={activeIncidents > 5 ? 'high' : undefined}
        />
        <StatisticsCard
          label="High+ Alerts"
          value={criticalCount}
          suffix="total"
          trend={criticalCount > 0 ? 'up' : 'neutral'}
          color={criticalCount > 0 ? 'critical' : undefined}
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Risk Gauge + Agent Status */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Risk Gauge */}
          <div className="glass rounded-xl p-6 border border-guardian-700/30 gradient-border">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 mb-4">
              Overall Risk Assessment
            </p>
            <RiskGauge
              score={latestAlert?.risk_score ?? 0}
              level={latestAlert?.risk_level ?? 'low'}
            />
            {latestAlert && (
              <div className="mt-4 pt-3 border-t border-guardian-700/30">
                <div className="flex justify-between text-[10px] text-guardian-500 font-mono">
                  <span>Avg (last 10): {avgRisk}</span>
                  <span>{new Date(latestAlert.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Agent Status */}
          <AgentStatusRow outputs={latestAlert?.agent_outputs} />

          {/* Input Center */}
          <InputCenter onResult={(alert) => pushAlert(alert)} />
        </div>

        {/* RIGHT COLUMN: SOP Recommendation Card */}
        <div className="lg:col-span-2">
          <SOPCard alert={latestAlert} />
        </div>

        {/* BOTTOM LEFT: Live Alert Feed */}
        <div className="lg:col-span-1 glass rounded-xl border border-guardian-700/30 overflow-hidden">
          <NotificationCenter
            cardTitle="Live Alerts"
            cardDescription="Supabase Realtime — updates without refresh"
            notifications={alerts.slice(0, 15).map(a => ({
              id: a.id,
              title: `${a.incident_type?.toUpperCase()} · ${getPlatform(a.camera_id)}`,
              description: `[${a.camera_id}] ${a.recommendation?.slice(0, 60) || ''}...`,
              time: new Date(a.created_at).toLocaleTimeString(),
              variant: a.risk_level,
            }))}
          />
        </div>

        {/* BOTTOM RIGHT: Incident History Table */}
        <div className="lg:col-span-2 glass rounded-xl border border-guardian-700/30 overflow-hidden">
          <div className="p-4 border-b border-guardian-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500">
                  Incident History
                </p>
                <p className="text-[10px] text-guardian-600 mt-0.5">
                  Duration column confirms temporal escalation is active
                </p>
              </div>
              <span className="text-[10px] font-mono text-guardian-600">
                {alerts.length} records
              </span>
            </div>
          </div>
          <TableComponent
            columns={[
              {
                key: 'created_at',
                label: 'Time',
                render: v => v ? new Date(v).toLocaleTimeString() : '—'
              },
              {
                id: 'platform',
                key: 'camera_id',
                label: 'Platform',
                render: (v) => getPlatform(v)
              },
              { key: 'camera_id', label: 'Camera' },
              { key: 'incident_type', label: 'Type' },
              { key: 'risk_level', label: 'Level' },
              {
                key: 'risk_score',
                label: 'Score',
                render: v => v?.toFixed(1) ?? '—'
              },
              {
                key: 'duration_seconds',
                label: 'Duration',
                render: v => v != null ? `${v}s` : '—'
              },
              {
                key: 'sop_clause',
                label: 'SOP Cited',
                render: v => v || '—'
              },
            ]}
            rows={alerts}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="mt-8 pt-4 border-t border-guardian-800/30 text-center">
        <p className="text-[10px] text-guardian-700 font-mono">
          Railway Guardian AI v1.0 · Multi-Agent Safety Command Center · Indian Railways
        </p>
      </footer>
    </div>
  )
}
