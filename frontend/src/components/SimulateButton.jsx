/**
 * SimulateButton — Dropdown button with three demo scenario triggers.
 * Calls the backend /simulate endpoint for each scenario.
 * Warm light theme — dark button, no neon.
 */

import { useState, useRef, useEffect } from 'react'

const SCENARIOS = [
  {
    label: '🧳 Unattended Bag',
    scenario: 'security',
    camera: 'CAM_002',
    description: 'Triggers security agent — SOP-SEC-01',
  },
  {
    label: '👥 Crowd Surge',
    scenario: 'crowd',
    camera: 'CAM_001',
    description: 'Triggers crowd agent — SOP-CROWD-01',
  },
  {
    label: '🚨 Fallen Passenger',
    scenario: 'distress',
    camera: 'CAM_003',
    description: 'Triggers distress agent — SOP-MED-01',
  },
]

export default function SimulateButton({ onResult }) {
  const [loading, setLoading] = useState(false)
  const [loadingScenario, setLoadingScenario] = useState(null)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const simulate = async (scenarioData) => {
    setLoading(true)
    setLoadingScenario(scenarioData.scenario)
    setOpen(false)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenarioData.scenario,
          camera_id: scenarioData.camera,
          intensity: 7.0,
        }),
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()

      if (data.alert) {
        onResult?.({
          ...data.alert,
          id: data.alert.id || `sim-${Date.now()}`,
          created_at: data.alert.created_at || new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error('Simulation error:', err)
      const fallbackAlert = _generateFallbackAlert(scenarioData)
      onResult?.(fallbackAlert)
    } finally {
      setLoading(false)
      setLoadingScenario(null)
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, border: 'none',
          background: loading ? '#DDD9D2' : '#1C1917',
          color: loading ? '#9C9690' : 'white',
          fontSize: 11, fontWeight: 500, cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: 12, height: 12, border: '2px solid #9C9690',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'pulse-dot 1s linear infinite',
            }} />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span>⚡</span>
            <span>Simulate</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, marginTop: 6, width: 240,
          background: 'white', border: '1px solid #DDD9D2', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 20, overflow: 'hidden',
        }} className="animate-fade-in-scale">
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #EFEDE8' }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9C9690' }}>
              Select Scenario
            </p>
          </div>
          {SCENARIOS.map((s) => (
            <button
              key={s.scenario}
              onClick={() => simulate(s)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                borderBottom: '1px solid #EFEDE8', transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.target.style.background = '#F7F4EF'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              <p style={{ fontSize: 12, fontWeight: 500, color: '#1C1917', margin: 0 }}>
                {s.label}
              </p>
              <p style={{ fontSize: 10, color: '#9C9690', margin: '2px 0 0' }}>
                {s.description}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function _generateFallbackAlert(scenarioData) {
  const now = new Date().toISOString()
  const scenarios = {
    security: {
      risk_score: 7.2,
      risk_level: 'high',
      incident_type: 'security',
      agent_outputs: {
        crowd: { risk_score: 2.0, finding: 'Low crowd density observed, 3 persons on platform.', escalation: false },
        security: { risk_score: 8.5, finding: 'Unattended bag detected on platform for 2+ minutes without owner.', escalation: true },
        distress: { risk_score: 0.0, finding: 'No distressed passengers detected.', escalation: false },
      },
      sop_clause: 'SOP-SEC-01',
      sop_text: 'Any unattended baggage observed for more than 2 minutes must be treated as a potential threat. RPF must cordon 15-metre radius and notify Bomb Detection Squad per Railway Security Circular 47B.',
      recommendation: 'URGENT: Unattended baggage detected on Platform 3 via CAM_002. Per SOP-SEC-01, RPF must immediately cordon a 15-metre radius around the object and notify the Bomb Detection Squad. Do not touch or move the object. Alert station master for potential platform evacuation.',
    },
    crowd: {
      risk_score: 6.8,
      risk_level: 'high',
      incident_type: 'crowd',
      agent_outputs: {
        crowd: { risk_score: 8.0, finding: '24 persons detected indicating dangerous overcrowding on platform.', escalation: true },
        security: { risk_score: 1.0, finding: 'No security threats detected.', escalation: false },
        distress: { risk_score: 0.0, finding: 'No distressed passengers detected.', escalation: false },
      },
      sop_clause: 'SOP-CROWD-01',
      sop_text: 'When platform density exceeds 4 persons per square metre, station master must activate crowd control protocol: close additional entry gates, deploy RPF personnel, announce platform change if possible.',
      recommendation: 'HIGH ALERT: Dangerous overcrowding detected on Platform 1 via CAM_001 with 24+ persons. Per SOP-CROWD-01, station master must immediately activate crowd control protocol — close excess entry gates, deploy RPF, and announce platform change if feasible.',
    },
    distress: {
      risk_score: 8.1,
      risk_level: 'critical',
      incident_type: 'distress',
      agent_outputs: {
        crowd: { risk_score: 1.5, finding: 'Normal crowd levels observed.', escalation: false },
        security: { risk_score: 0.0, finding: 'No security threats detected.', escalation: false },
        distress: { risk_score: 9.0, finding: 'Fallen passenger detected in horizontal posture — possible medical emergency.', escalation: true },
      },
      sop_clause: 'SOP-MED-01',
      sop_text: 'Passenger found in collapsed or unresponsive state: immediately call station medical team (1800-111-139), clear area, initiate first aid if trained personnel are on site. Alert train crew if incident is near boarding zone.',
      recommendation: 'CRITICAL: Fallen passenger detected on Platform 3 via CAM_003 — possible medical emergency. Per SOP-MED-01, immediately call station medical team at 1800-111-139, clear the area, and initiate first aid. Log in Station Incident Register within 10 minutes per SOP-MED-02.',
    },
  }

  const scenario = scenarios[scenarioData.scenario] || scenarios.security

  return {
    id: `fallback-${Date.now()}`,
    created_at: now,
    camera_id: scenarioData.camera,
    frame_url: null,
    duration_seconds: 0,
    resolved: false,
    ...scenario,
  }
}
