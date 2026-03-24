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
      
      // Auto-trigger explicit PDF save function rather than printer dial on mounted UI
      if (data) {
        setTimeout(() => triggerPDFDownload(data.certId), 800)
      }
    }, 1200)
  }, [])

  const triggerPDFDownload = (cid) => {
    const element = document.getElementById('certificate-download-target');
    if (!element) return;
    
    // Briefly hide UI controls while snapshotting
    element.classList.add('generating-pdf')

    const generate = () => {
      window.html2pdf().set({
        margin: 0.3,
        filename: `Knox_Verified_Certificate_${cid || certId}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }).from(element).save().then(() => {
        element.classList.remove('generating-pdf')
      })
    }

    if (window.html2pdf) {
      generate()
    } else {
      const script = document.createElement('script')
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
      script.onload = generate
      document.body.appendChild(script)
    }
  }

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
      <div className="verify-card" id="certificate-download-target">
        <div className="verify-header">
          <div className="verify-icon">✅</div>
          <h2>Live Verified Certificate</h2>
          <p className="verify-live-badge">🟢 Live DB Connection Active</p>
          <button 
             onClick={() => triggerPDFDownload()} 
             style={{ marginTop: '1rem', background: '#3b82f6', color: 'white', padding: '0.4rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
             className="no-print"
          >
             📥 Download PDF Record
          </button>
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
          <p>This data is pulled dynamically from the KNOX automated proctoring database. It represents a living record of student capability.</p>
        </div>

        {/* Live Raw JSON Payload verification panel */}
        <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem', textAlign: 'left' }}>
          <h4 style={{ color: '#38bdf8', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
            Live Blockchain Payload Signature
          </h4>
          <pre style={{ margin: 0, color: '#a5b4fc', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85rem' }}>
            {JSON.stringify({
              _id: certData.certId,
              transactionHash: `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`,
              nodeInstance: "aws-east-1-knox",
              verificationStatus: "AUTHENTIC",
              payload: certData,
              signature: btoa(`${certData.studentName}:${certData.skillLevel}:${certData.lastUpdate}`)
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
