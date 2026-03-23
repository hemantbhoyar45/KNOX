import { useEffect, useState } from 'react'
import { verifyCertificate } from './CertificateManager'
import './CertificateVerificationPage.css'

export default function CertificateVerificationPage() {
  const [certData, setCertData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [certId, setCertId] = useState('')

  useEffect(() => {
    // Extract cert ID from URL pathname (e.g. /verify/KNOX-2026-X8F9A)
    const pathParts = window.location.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    setCertId(id)

    // Simulate network delay for verification authenticity
    setTimeout(() => {
      const data = verifyCertificate(id)
      setCertData(data)
      setLoading(false)
    }, 1200)
  }, [])

  if (loading) {
    return (
      <div className="verify-loading">
        <div className="verify-pulse"></div>
        <p>Connecting to Live Verification Database...</p>
      </div>
    )
  }

  if (!certData) {
    return (
      <div className="verify-shell failed">
        <div className="verify-card">
          <div className="verify-icon">❌</div>
          <h1>Verification Failed</h1>
          <p>Certificate ID <strong>{certId}</strong> does not exist or has been revoked in the KNOX database.</p>
          <a href="/" className="verify-btn">Return Home</a>
        </div>
      </div>
    )
  }

  const formatDate = (iso) => new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  })

  return (
    <div className="verify-shell success">
      <div className="verify-card">
        <div className="verify-header">
          <div className="verify-icon">✅</div>
          <h2>Live Verified Certificate</h2>
          <p className="verify-live-badge">🟢 Live DB Connection Active</p>
        </div>

        <div className="verify-body">
          <div className="verify-row">
            <span>Certificate Owner</span>
            <strong>{certData.studentName}</strong>
          </div>
          <div className="verify-row">
            <span>Course Name</span>
            <strong>{certData.courseName}</strong>
          </div>
          <div className="verify-row">
            <span>Verification ID</span>
            <strong className="mono">{certData.certId}</strong>
          </div>
          
          <div className="verify-divider"></div>
          
          <div className="verify-row">
            <span>Initial Issue Date</span>
            <span>{formatDate(certData.issueDate)}</span>
          </div>
          <div className="verify-row">
            <span>Latest Validation Timestamp</span>
            <span className="live-update">{formatDate(certData.lastUpdate)}</span>
          </div>
          <div className="verify-row">
            <span>Current Status</span>
            <strong className="status-good">{certData.status}</strong>
          </div>

          <div className="verify-divider"></div>

          <div className="verify-row skill-row">
            <div>
              <span>Current Skill Level</span>
              <p className="verify-hint">Skill levels automatically increase when students pass follow-up retention quizzes without failing proctor checks.</p>
            </div>
            <div className={`skill-badge level-${certData.skillLevel.toLowerCase()}`}>
              {certData.skillLevel.toUpperCase()}
            </div>
          </div>
          <div className="verify-row">
             <span>Retakes/Reassessments Passed</span>
             <strong>{certData.reassessmentsPassed || 0} times</strong>
          </div>
        </div>

        <div className="verify-footer">
          <p>This data is pulled dynamically from the KNOX automated proctoring & assessment database. It represents a living record of student capability rather than a static diploma.</p>
        </div>
      </div>
    </div>
  )
}
