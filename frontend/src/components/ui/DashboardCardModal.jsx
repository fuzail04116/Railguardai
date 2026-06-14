/**
 * DashboardCardModal — Card with click-to-expand modal overlay.
 * Card displays summary content; clicking opens a full-detail modal.
 * Warm light theme.
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
        className={`cursor-pointer transition-all duration-200 ease-out hover:shadow-lg ${className || 'card'}`}
        style={{ padding: 18 }}
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
          <div className="absolute inset-0 animate-fade-in" style={{ background: 'rgba(28, 25, 23, 0.5)', backdropFilter: 'blur(8px)' }} />

          {/* Modal */}
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-scale"
            style={{
              background: 'white', borderRadius: 14, border: '1px solid #DDD9D2',
              boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid #DDD9D2',
              background: 'white', borderRadius: '14px 14px 0 0',
            }}>
              <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#1C1917', margin: 0 }}>
                {modalTitle || 'Details'}
              </h2>
              <button
                onClick={close}
                style={{
                  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, border: '1px solid #DDD9D2', background: '#F7F4EF',
                  color: '#6B6560', fontSize: 16, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.target.style.background = '#EFEDE8'}
                onMouseLeave={e => e.target.style.background = '#F7F4EF'}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 20 }}>
              {modalContent}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
