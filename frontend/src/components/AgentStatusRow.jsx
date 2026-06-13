/**
 * AgentStatusRow — Three TrackerCard tiles for crowd/security/distress agents.
 * Shows each agent's risk score, finding, and status.
 */

import { TrackerCard } from './ui/TrackerCard'

const AGENTS = [
  { key: 'crowd',    label: 'Crowd Agent',    icon: '👥' },
  { key: 'security', label: 'Security Agent', icon: '🔒' },
  { key: 'distress', label: 'Distress Agent', icon: '🚨' },
]

export default function AgentStatusRow({ outputs }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 px-1">
        Agent Status
      </p>
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

        return (
          <TrackerCard
            key={key}
            title={`${icon} ${label}`}
            status={status}
            value={hasData ? data.risk_score.toFixed(1) : '—'}
            valueLabel="/ 10"
            description={hasData ? data.finding : 'Awaiting detection data...'}
          />
        )
      })}
    </div>
  )
}
