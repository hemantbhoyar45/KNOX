import { QRCodeCanvas } from 'qrcode.react'
import { verifyCertificate } from './CertificateManager'
import './CertificateView.css'

export default function CertificateView({ certId, onBack }) {
  const certData = verifyCertificate(certId)

  if (!certData) {
    return (
      <div className="cert-error-page">
        <h2>❌ Invalid Certificate</h2>
        <button type="button" onClick={onBack}>Go Back</button>
      </div>
    )
  }

  // The dynamic link encoded in the QR code ensures the actual dot-matrix of the QR physically changes 
  // whenever the student is upgraded to the next skill level!
  const verifyUrl = `${window.location.origin}/verify/${certId}?level=${certData.skillLevel.toLowerCase()}&updated=${new Date(certData.lastUpdate).getTime()}`
  const formattedDate = new Date(certData.issueDate).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="cert-view-shell">
      <div className="cert-paper">
        <div className="cert-content">
          <header className="cert-head">
            <span className="cert-logo">⚡ KNOX</span>
            <h1>CERTIFICATE OF ACHIEVEMENT</h1>
            <p className="cert-subtitle">This verifies that the following learner has successfully mastered the course material under strict AI Proctoring and continuous verification.</p>
          </header>

          <main className="cert-body">
            <h2 className="cert-student-name">{certData.studentName}</h2>
            <div className="divider"></div>
            <p className="cert-has">has successfully completed</p>
            <h3 className="course-name">{certData.courseName}</h3>
          </main>

          <section className="cert-stats">
            <div className="stat-pill">
              <span className="label">Live Skill Level</span>
              <span className={`value level-${certData.skillLevel.toLowerCase()}`}>
                {certData.skillLevel.toUpperCase()}
              </span>
            </div>
            <div className="stat-pill">
              <span className="label">Awarded</span>
              <span className="value">{formattedDate}</span>
            </div>
            <div className="stat-pill">
              <span className="label">Verification ID</span>
              <span className="value">{certData.certId}</span>
            </div>
          </section>

          <footer className="cert-footer">
            <div className="qr-section">
              <div className="qr-box">
                <QRCodeCanvas 
                  value={verifyUrl} 
                  size={120} 
                  level="H" 
                  fgColor="#0f172a" 
                  bgColor="#ffffff" 
                  includeMargin={true} 
                />
              </div>
              <p className="qr-hint">Scan for Live Validation</p>
            </div>
            <div className="signature-section">
              <div className="signature-line">
                <span className="sig-text">KNOX Learning System</span>
              </div>
              <p>Automated Issuance</p>
            </div>
          </footer>
        </div>
      </div>
      
      <div className="cert-actions">
        <button type="button" onClick={onBack} className="cert-button back">
          ← Return to Dashboard
        </button>
        <button type="button" onClick={() => window.print()} className="cert-button print">
          🖨 Print / Save PDF
        </button>
      </div>
    </div>
  )
}
