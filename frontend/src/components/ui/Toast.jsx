/**
 * Toast — Animated notification toast that slides in from the right.
 * Auto-dismisses after 8 seconds. Color-coded by severity.
 */

import { useEffect, useState } from 'react'

const VARIANT_STYLES = {
  destructive: {
    bg: 'bg-red-950/90 border-red-500/50',
    icon: '🚨',
    glow: 'shadow-[0_0_24px_rgba(239,68,68,0.2)]',
    accent: 'text-red-400',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-orange-950/90 border-orange-500/50',
    icon: '⚠️',
    glow: 'shadow-[0_0_24px_rgba(249,115,22,0.2)]',
    accent: 'text-orange-400',
    progress: 'bg-orange-500',
  },
  info: {
    bg: 'bg-cyan-950/90 border-cyan-500/50',
    icon: 'ℹ️',
    glow: 'shadow-[0_0_24px_rgba(6,182,212,0.2)]',
    accent: 'text-cyan-400',
    progress: 'bg-cyan-500',
  },
}

const AUTO_DISMISS_MS = 8000

export function Toast({ title, description, variant = 'info', onDismiss }) {
  const config = VARIANT_STYLES[variant] || VARIANT_STYLES.info
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onDismiss?.(), 300)
    }, AUTO_DISMISS_MS)

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - (100 / (AUTO_DISMISS_MS / 50))))
    }, 50)

    return () => {
      clearTimeout(dismissTimer)
      clearInterval(interval)
    }
  }, [onDismiss])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => onDismiss?.(), 300)
  }

  return (
    <div
      className={`
        relative w-80 border rounded-xl overflow-hidden
        backdrop-blur-xl
        ${config.bg} ${config.glow}
        ${isExiting ? 'animate-[slide-out-right_0.3s_ease-in_forwards]' : 'animate-slide-in'}
      `}
      style={isExiting ? { animation: 'slide-out-right 0.3s ease-in forwards' } : undefined}
    >
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0 mt-0.5">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wide ${config.accent}`}>
              {title}
            </p>
            {description && (
              <p className="text-[11px] text-guardian-300 mt-1 leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-guardian-400 hover:text-white transition-colors text-sm"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-guardian-800/50 w-full">
        <div
          className={`h-full ${config.progress} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
