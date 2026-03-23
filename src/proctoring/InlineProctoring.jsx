import { useEffect, useRef, useState } from 'react'
import { loadFaceModels, startProctoringLoop } from './ProctoringEngine'
import { initBrowserLockdown } from './BrowserLockdown'
import { createAudioMonitor } from './AudioMonitor'

const STORAGE_KEY = 'knox_face_descriptor'

export default function InlineProctoring({ onViolation, strictMode = false }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const procLoopRef = useRef(null)
  const lockdownRef = useRef(null)
  const audioMonRef = useRef(null)
  const [active, setActive] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  
  // Use ref for the callback so changing the callback doesn't restart the camera
  const onViolationRef = useRef(onViolation)
  useEffect(() => {
    onViolationRef.current = onViolation
  }, [onViolation])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        await loadFaceModels()
        if (!mounted) return

        let storedDescriptor = null
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) storedDescriptor = JSON.parse(saved)
        } catch {}

        if (strictMode) {
          lockdownRef.current = initBrowserLockdown((type, detail) => {
            onViolationRef.current?.(type, detail)
          })
          
          try {
            const audio = createAudioMonitor((type, detail) => {
              onViolationRef.current?.(type, detail)
            })
            audioMonRef.current = audio
            await audio.start()
          } catch {
             console.warn('Microphone strictly required but access denied.')
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        setActive(true)

        // Delayed start to ensure video is fully playing
        setTimeout(() => {
          if (videoRef.current && mounted) {
            procLoopRef.current = startProctoringLoop(videoRef.current, storedDescriptor, (type, detail) => {
              onViolationRef.current?.(type, detail)
            })
          }
        }, 1500)

      } catch (err) {
        setErrorMsg('Camera access denied or models failed to load.')
      }
    }
    
    init()

    return () => {
      mounted = false
      procLoopRef.current?.stop()
      lockdownRef.current?.cleanup()
      audioMonRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, []) // Empty dependency array means this runs ONCE on mount

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
      border: `1px solid ${active ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
      width: '160px', flexShrink: 0
    }}>
      <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', aspectRatio: '4/3', position: 'relative' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
        />
        {!active && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', fontSize: '0.8rem', color: '#ef4444', textAlign: 'center', padding: '0.5rem' }}>{errorMsg || 'Starting...'}</div>}
      </div>
      <div style={{ fontSize: '0.7rem', color: active ? '#22c55e' : '#ef4444', textAlign: 'center', fontWeight: 'bold' }}>
        {active ? '● LIVE PROCTORING' : '○ NO CAMERA'}
      </div>
    </div>
  )
}
