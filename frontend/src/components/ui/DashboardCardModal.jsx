/**
 * DashboardCardModal — Card with click-to-expand modal overlay.
 * Card displays summary content; clicking opens a full-detail modal with backdrop blur.
 */

import { useState, useEffect, useCallback } from 'react'

export function DashboardCardModal({ className, cardContent, modalTitle, modalContent }) {
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => setIsOpen(false), [])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Card */}
      <div
        onClick={() => setIsOpen(true)}
        className={`
          cursor-pointer p-6
          transition-all duration-300 ease-out
          hover:shadow-xl hover:shadow-accent-cyan/5
          hover:scale-[1.005]
          ${className || 'bg-guardian-800 rounded-xl border border-guardian-700'}
        `}
      >
        {cardContent}
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-guardian-950/80 backdrop-blur-md animate-fade-in" />

          {/* Modal */}
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl shadow-2xl shadow-accent-cyan/10 animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-guardian-700/50 bg-guardian-800/90 backdrop-blur-lg rounded-t-2xl">
              <h2 className="text-sm font-bold tracking-wide text-guardian-200 uppercase">
                {modalTitle || 'Details'}
              </h2>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-guardian-700/50 hover:bg-guardian-600/50 text-guardian-400 hover:text-white transition-colors text-lg"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {modalContent}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
