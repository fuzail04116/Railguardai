/**
 * InputCenter — Upload & Analysis Input Panel
 * 
 * Three modes:
 * 1. Image Upload — drag-and-drop or click (.jpg, .png)
 * 2. Video Upload — drag-and-drop or click (.mp4, .avi, .mov)
 * 3. Demo Simulation — quick-fire test scenarios
 * 
 * Uploads are sent to the FastAPI backend and results are pushed
 * into the dashboard via the onResult callback.
 */

import { useState, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TABS = [
  { id: 'image', label: '📷 Image', icon: '📷' },
  { id: 'video', label: '🎥 Video', icon: '🎥' },
  { id: 'demo',  label: '⚡ Demo',  icon: '⚡' },
]

const DEMO_SCENARIOS = [
  { label: '🧳 Unattended Bag', scenario: 'security', camera: 'CAM_002', desc: 'Triggers SOP-SEC-01' },
  { label: '👥 Crowd Surge',    scenario: 'crowd',    camera: 'CAM_001', desc: 'Triggers SOP-CROWD-01' },
  { label: '🚨 Fallen Passenger', scenario: 'distress', camera: 'CAM_003', desc: 'Triggers SOP-MED-01' },
]

const CAMERA_OPTIONS = ['CAM_001', 'CAM_002', 'CAM_003', 'CAM_004']

export default function InputCenter({ onResult }) {
  const [activeTab, setActiveTab] = useState('image')
  const [cameraId, setCameraId] = useState('CAM_001')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(null)
  const [previewName, setPreviewName] = useState('')
  const [videoInfo, setVideoInfo] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const resetState = () => {
    setPreview(null)
    setPreviewName('')
    setVideoInfo(null)
    setError(null)
    setProgress('')
  }

  /* ── File Selection ── */
  const handleFileSelect = useCallback((file) => {
    if (!file) return
    resetState()

    const isImage = /\.(jpe?g|png)$/i.test(file.name)
    const isVideo = /\.(mp4|avi|mov|mkv)$/i.test(file.name)

    if (activeTab === 'image' && !isImage) {
      setError('Please upload a .jpg or .png image')
      return
    }
    if (activeTab === 'video' && !isVideo) {
      setError('Please upload a .mp4, .avi, or .mov video')
      return
    }

    setPreviewName(file.name)

    if (isImage) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    // Auto-upload
    uploadFile(file)
  }, [activeTab, cameraId])

  /* ── Drag & Drop ── */
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  /* ── Upload to Backend ── */
  const uploadFile = async (file) => {
    setUploading(true)
    setError(null)
    setVideoInfo(null)

    const isVideo = /\.(mp4|avi|mov|mkv)$/i.test(file.name)
    const endpoint = isVideo ? '/analyze-video' : '/analyze'

    setProgress(isVideo ? 'Uploading video...' : 'Uploading image...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const url = `${API_URL}${endpoint}?camera_id=${cameraId}${isVideo ? '&max_frames=5' : ''}`

      setProgress(isVideo ? 'Extracting frames & running YOLO...' : 'Running YOLO detection...')

      const response = await fetch(url, { method: 'POST', body: formData })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error ${response.status}`)
      }

      setProgress('Running AI agents...')
      const data = await response.json()

      // Store video metadata if applicable
      if (data.video_info) {
        setVideoInfo(data.video_info)
      }

      // Push alert to dashboard
      if (data.alert) {
        setProgress('✅ Analysis complete!')
        onResult?.({
          ...data.alert,
          id: data.alert.id || `upload-${Date.now()}`,
          created_at: data.alert.created_at || new Date().toISOString(),
        })
      }

      // Clear progress after 3s
      setTimeout(() => setProgress(''), 3000)

    } catch (err) {
      console.error('Upload failed:', err)
      setError(err.message || 'Upload failed — is the backend running?')
      setProgress('')
    } finally {
      setUploading(false)
    }
  }

  /* ── Demo Simulate ── */
  const runDemo = async (scenario) => {
    setUploading(true)
    setError(null)
    resetState()
    setProgress(`Simulating ${scenario.label}...`)

    try {
      const response = await fetch(`${API_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario.scenario,
          camera_id: scenario.camera,
          intensity: 7.0,
        }),
      })

      if (!response.ok) throw new Error(`Server error ${response.status}`)
      const data = await response.json()

      if (data.alert) {
        setProgress('✅ Simulation complete!')
        onResult?.({
          ...data.alert,
          id: data.alert.id || `sim-${Date.now()}`,
          created_at: data.alert.created_at || new Date().toISOString(),
        })
      }
      setTimeout(() => setProgress(''), 3000)
    } catch (err) {
      setError(err.message || 'Simulation failed')
      setProgress('')
    } finally {
      setUploading(false)
    }
  }

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div className="glass rounded-xl border border-guardian-700/30 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-guardian-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-[11px]">
            📡
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-400">
              Input Center
            </p>
            <p className="text-[9px] text-guardian-600">Feed data to the Guardian AI pipeline</p>
          </div>
        </div>

        {/* Camera selector */}
        <select
          value={cameraId}
          onChange={(e) => setCameraId(e.target.value)}
          className="text-[11px] font-mono bg-guardian-800 border border-guardian-700 rounded-lg px-2 py-1.5 text-guardian-300 focus:border-accent-cyan focus:outline-none cursor-pointer"
        >
          {CAMERA_OPTIONS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-guardian-700/30">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); resetState() }}
            className={`flex-1 px-3 py-2.5 text-[11px] font-semibold tracking-wide transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-accent-cyan border-b-2 border-accent-cyan bg-accent-cyan/5'
                : 'text-guardian-500 hover:text-guardian-300 hover:bg-guardian-700/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* ── Image / Video Upload Tab ── */}
        {(activeTab === 'image' || activeTab === 'video') && (
          <div>
            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer
                transition-all duration-300
                ${dragOver
                  ? 'border-accent-cyan bg-accent-cyan/10 scale-[1.01]'
                  : uploading
                    ? 'border-guardian-600 bg-guardian-800/30 cursor-wait'
                    : 'border-guardian-600 hover:border-accent-cyan/50 hover:bg-guardian-800/20'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={activeTab === 'image' ? '.jpg,.jpeg,.png' : '.mp4,.avi,.mov,.mkv'}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                disabled={uploading}
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                  <p className="text-[12px] text-accent-cyan font-medium">{progress}</p>
                </div>
              ) : preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-lg border border-guardian-700" />
                  <p className="text-[11px] text-guardian-400 font-mono">{previewName}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl opacity-30">
                    {activeTab === 'image' ? '📷' : '🎥'}
                  </div>
                  <p className="text-[12px] text-guardian-300 font-medium">
                    {activeTab === 'image'
                      ? 'Drop CCTV image or click to browse'
                      : 'Drop video file or click to browse'
                    }
                  </p>
                  <p className="text-[10px] text-guardian-600">
                    {activeTab === 'image'
                      ? 'Supports .jpg, .png'
                      : 'Supports .mp4, .avi, .mov · Max 5 frames sampled'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Video analysis results */}
            {videoInfo && (
              <div className="mt-3 bg-guardian-800/30 rounded-lg p-3 border border-guardian-700/30 animate-fade-in">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-guardian-500 mb-2">
                  🎥 Video Analysis Summary
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[9px] text-guardian-600 uppercase">Duration</p>
                    <p className="text-[12px] font-mono font-bold text-guardian-300">{videoInfo.duration_seconds}s</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-guardian-600 uppercase">FPS</p>
                    <p className="text-[12px] font-mono font-bold text-guardian-300">{videoInfo.fps}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-guardian-600 uppercase">Total Frames</p>
                    <p className="text-[12px] font-mono font-bold text-guardian-300">{videoInfo.total_frames}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-guardian-600 uppercase">Analyzed</p>
                    <p className="text-[12px] font-mono font-bold text-accent-cyan">{videoInfo.frames_analyzed}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Demo Simulation Tab ── */}
        {activeTab === 'demo' && (
          <div className="space-y-2">
            {DEMO_SCENARIOS.map((s) => (
              <button
                key={s.scenario}
                onClick={() => runDemo(s)}
                disabled={uploading}
                className={`
                  w-full text-left rounded-lg px-4 py-3 border transition-all duration-200
                  ${uploading
                    ? 'border-guardian-700 bg-guardian-800/30 opacity-50 cursor-wait'
                    : 'border-guardian-700/30 bg-guardian-800/20 hover:bg-guardian-700/30 hover:border-accent-cyan/30 hover:shadow-md'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-guardian-200 font-semibold">{s.label}</p>
                    <p className="text-[10px] text-guardian-500 mt-0.5">{s.desc} · {s.camera}</p>
                  </div>
                  <span className="text-guardian-600 text-sm">→</span>
                </div>
              </button>
            ))}

            {uploading && (
              <div className="flex items-center justify-center gap-2 py-3 animate-fade-in">
                <div className="w-4 h-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] text-accent-cyan font-medium">{progress}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Status Messages ── */}
        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 animate-fade-in">
            <p className="text-[11px] text-red-400 flex items-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          </div>
        )}

        {progress && !uploading && !error && (
          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 animate-fade-in">
            <p className="text-[11px] text-emerald-400">{progress}</p>
          </div>
        )}
      </div>
    </div>
  )
}
