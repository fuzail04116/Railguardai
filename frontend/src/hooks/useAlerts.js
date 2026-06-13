import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Custom hook for managing alerts with Supabase Realtime subscription.
 * - Loads recent alert history on mount
 * - Subscribes to real-time INSERT events on the alerts table
 * - Manages toast queue for critical/high alerts
 * - Provides pushAlert for manual (simulated) alert injection
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState([])
  const [latestAlert, setLatestAlert] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  const pushAlert = useCallback((alert) => {
    setLatestAlert(alert)
    setAlerts(prev => [alert, ...prev].slice(0, 50))

    // Enqueue toast for critical or high severity
    if (alert.risk_level === 'critical' || alert.risk_level === 'high') {
      const toastId = alert.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToastQueue(prev => [...prev, { ...alert, _toastId: toastId }])
    }
  }, [])

  const dismissToast = useCallback((toastId) => {
    setToastQueue(prev => prev.filter(t => t._toastId !== toastId))
  }, [])

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase not available — alerts will only work via simulation')
      return
    }

    // Load recent alert history
    supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load alerts:', error)
          return
        }
        if (data?.length) {
          setAlerts(data)
          setLatestAlert(data[0])
        }
      })

    // Subscribe to realtime INSERT events
    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('🔔 New alert received:', payload.new)
          pushAlert(payload.new)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        console.log('📡 Realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pushAlert])

  return {
    alerts,
    latestAlert,
    toastQueue,
    dismissToast,
    pushAlert,
    isConnected
  }
}
