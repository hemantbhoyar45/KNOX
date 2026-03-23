import { useEffect, useRef, useState } from 'react'
import { loadFaceModels, extractFaceDescriptor, compareFaces } from './ProctoringEngine'
import './FaceVerification.css'

const STEPS = {
  LOADING: 'loading',
  CAPTURE_REGISTER: 'capture_register',
  REGISTERING: 'registering',
  VERIFY: 'verify',
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  FAILED: 'failed',
}

export default function FaceVerification({ storedDescriptor, onRegistered, onVerified, onFailed, mode = 'register' }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [step, setStep] = useState(STEPS.LOADING)
  const [message, setMessage] = useState('Loading face detection models...')
  const [confidence, setConfidence] = useState(null)
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        await loadFaceModels()
        if (!mounted) return
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setStep(mode === 'register' ? STEPS.CAPTURE_REGISTER : STEPS.VERIFY)
        setMessage(mode === 'register' ? 'Position your face clearly in the frame and click Capture.' : 'Look directly at the camera to verify your identity.')
      } catch (err) {
        setMessage('Camera access denied. Please allow webcam access to continue.')
      }
    }
    init()
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [mode])

  const startCountdown = (callback) => {
    setCountdown(3)
    let c = 3
    const id = setInterval(() => {
      c--
      setCountdown(c)
      if (c === 0) {
        clearInterval(id)
        setCountdown(null)
        callback()
      }
    }, 1000)
  }

  const handleCapture = () => {
    startCountdown(async () => {
      setStep(STEPS.REGISTERING)
      setMessage('Analyzing your face...')
      try {
        const result = await extractFaceDescriptor(videoRef.current)
        if (!result) {
          setMessage('No face detected. Please ensure good lighting and face the camera.')
          setStep(STEPS.CAPTURE_REGISTER)
          return
        }
        onRegistered?.(result.descriptor)
        setMessage('Face registered successfully! You can now start the exam.')
        setStep(STEPS.SUCCESS)
      } catch {
        setMessage('Face capture failed. Please try again.')
        setStep(STEPS.CAPTURE_REGISTER)
      }
    })
  }

  const handleVerify = () => {
    startCountdown(async () => {
      setStep(STEPS.VERIFYING)
      setMessage('Verifying your identity...')
      try {
        const result = await extractFaceDescriptor(videoRef.current)
        if (!result) {
          setStep(STEPS.FAILED)
          setMessage('No face detected. Please sit in front of the camera.')
          onFailed?.('No face detected during verification')
          return
        }
        const distance = compareFaces(storedDescriptor, result.descriptor)
        const matchScore = Math.max(0, Math.round((1 - distance) * 100))
        setConfidence(matchScore)
        if (distance < 0.6) {
          setStep(STEPS.SUCCESS)
          setMessage(`Identity verified! Match confidence: ${matchScore}%`)
          onVerified?.(matchScore)
        } else {
          setStep(STEPS.FAILED)
          setMessage(`Verification failed. Match confidence: ${matchScore}%. Please contact your instructor.`)
          onFailed?.(`Identity mismatch, distance: ${distance.toFixed(2)}`)
        }
      } catch {
        setStep(STEPS.FAILED)
        setMessage('Verification error. Try again or contact support.')
        onFailed?.('Verification error')
      }
    })
  }

  return (
    <div className="face-verify-shell">
      <div className="face-verify-card">
        <h2>{mode === 'register' ? '📸 Identity Registration' : '🔐 Identity Verification'}</h2>
        <p className="face-status-msg">{message}</p>

        <div className="webcam-wrapper">
          <video ref={videoRef} autoPlay muted playsInline className="face-video" />
          <div className={`face-overlay ${step === STEPS.SUCCESS ? 'success' : step === STEPS.FAILED ? 'failed' : ''}`}>
            {countdown !== null && <div className="countdown">{countdown}</div>}
            {step === STEPS.SUCCESS && <div className="checkmark">✓</div>}
            {step === STEPS.FAILED && <div className="crossmark">✗</div>}
          </div>
        </div>

        {confidence !== null && (
          <div className={`confidence-bar ${confidence >= 60 ? 'good' : 'bad'}`}>
            <div className="bar-fill" style={{ width: `${confidence}%` }} />
            <span>{confidence}% match</span>
          </div>
        )}

        <div className="face-verify-actions">
          {step === STEPS.CAPTURE_REGISTER && (
            <button type="button" onClick={handleCapture} className="primary-btn">
              📸 Capture My Face
            </button>
          )}
          {step === STEPS.VERIFY && (
            <button type="button" onClick={handleVerify} className="primary-btn">
              🔐 Verify My Identity
            </button>
          )}
          {(step === STEPS.REGISTERING || step === STEPS.VERIFYING) && (
            <button type="button" disabled className="primary-btn loading">Analyzing...</button>
          )}
          {step === STEPS.FAILED && (
            <button type="button" onClick={() => setStep(mode === 'register' ? STEPS.CAPTURE_REGISTER : STEPS.VERIFY)} className="retry-btn">
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
