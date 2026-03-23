import { useEffect, useState } from 'react'
import FaceVerification from './FaceVerification'
import ExamPage from './ExamPage'
import ProctoringReport from './ProctoringReport'

const FLOW = { REGISTER: 'register', VERIFY: 'verify', EXAM: 'exam', REPORT: 'report', BLOCKED: 'blocked' }
const STORAGE_KEY = 'knox_face_descriptor'

export default function ProctorFlow({ studentName = 'Student', onExit }) {
  const [flow, setFlow] = useState(null) // null = loading
  const [storedDescriptor, setStoredDescriptor] = useState(null)
  const [reportData, setReportData] = useState(null)

  // On mount: check if face already registered
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setStoredDescriptor(parsed)
        // Already registered — go straight to verify
        setFlow(FLOW.VERIFY)
      } else {
        setFlow(FLOW.REGISTER)
      }
    } catch {
      setFlow(FLOW.REGISTER)
    }
  }, [])

  const handleRegistered = (descriptor) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(descriptor))
    } catch {
      console.warn('Could not persist face descriptor to localStorage')
    }
    setStoredDescriptor(descriptor)
    setFlow(FLOW.VERIFY)
  }

  if (!flow) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}>
        Loading...
      </div>
    )
  }

  return (
    <>
      {flow === FLOW.REGISTER && (
        <FaceVerification
          mode="register"
          onRegistered={handleRegistered}
        />
      )}

      {flow === FLOW.VERIFY && (
        <FaceVerification
          mode="verify"
          storedDescriptor={storedDescriptor}
          onVerified={() => setFlow(FLOW.EXAM)}
          onFailed={(reason) => {
            console.warn('Verification failed:', reason)
            setFlow(FLOW.BLOCKED)
          }}
        />
      )}

      {flow === FLOW.EXAM && (
        <ExamPage
          storedDescriptor={storedDescriptor}
          studentName={studentName}
          onExamComplete={(data) => {
            setReportData(data)
            setFlow(FLOW.REPORT)
          }}
        />
      )}

      {flow === FLOW.REPORT && (
        <ProctoringReport
          data={reportData}
          studentName={studentName}
          onFinish={onExit}
          onViewCertificate={(certId) => {
            // Can pass this up if we want to navigate
            window.location.href = `/certificate/${certId}`
          }}
        />
      )}

      {flow === FLOW.BLOCKED && (
        <div style={{
          minHeight: '100vh', background: '#0f172a', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          gap: '1rem', fontFamily: 'Inter, sans-serif', color: '#f1f5f9', textAlign: 'center', padding: '2rem'
        }}>
          <div style={{ fontSize: '4rem' }}>🔒</div>
          <h1 style={{ color: '#ef4444', margin: 0 }}>Exam Access Blocked</h1>
          <p style={{ color: '#94a3b8', maxWidth: '400px' }}>
            Your face could not be verified. Please contact your instructor or exam administrator.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY)
                setFlow(FLOW.REGISTER)
              }}
              style={{ padding: '0.75rem 1.5rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#a5b4fc', cursor: 'pointer' }}
            >
              Re-register Face
            </button>
            <button
              type="button"
              onClick={onExit}
              style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer' }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  )
}

