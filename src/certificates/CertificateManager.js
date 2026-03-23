const DB_KEY = 'knox_certificates_db'

// Initialize or get certificates from localStorage
export function getCertificates() {
  try {
    const data = localStorage.getItem(DB_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

// Save to localStorage
export function saveCertificates(certs) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(certs))
  } catch (err) {
    console.error('Failed to save certificate DB', err)
  }
}

// Generate a random cert ID (e.g. KNOX-2026-X8F9A)
function generateCertId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomStr = Array.from({ length: 5 }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
  return `KNOX-${new Date().getFullYear()}-${randomStr}`
}

/**
 * Automatically maps a student to a certificate for a course.
 * If the student re-takes the course / quiz, we bump their skill level 
 * based on the target level requested.
 */
export function issueOrUpdateCertificate(studentName, courseName, riskScore, targetSkillLevel = 'Beginner') {
  // If exam integrity was completely compromised, don't issue or upgrade
  if (riskScore > 70) {
    return { success: false, reason: 'High Risk Proctoring Score - Certificate Withheld' }
  }

  const certs = getCertificates()
  
  // Find if they already have a certificate for this course
  let existingCertId = null
  for (const [id, cert] of Object.entries(certs)) {
    if (cert.studentName === studentName && cert.courseName === courseName) {
      existingCertId = id
      break
    }
  }

  const now = new Date().toISOString()

  if (existingCertId) {
    // Upgrading existing certificate! Dynamic QR link remains the same.
    const cert = certs[existingCertId]
    cert.lastUpdate = now

    // Progressive Skill Level Logic dictated by the exact course module they took
    cert.skillLevel = targetSkillLevel
    
    cert.reassessmentsPassed = (cert.reassessmentsPassed || 0) + 1
    saveCertificates(certs)
    return { success: true, certId: existingCertId, upgraded: true, currentLevel: cert.skillLevel }
  }

  // Issuing NEW Certificate (First time passing course)
  const newCertId = generateCertId()
  certs[newCertId] = {
    certId: newCertId,
    studentName,
    courseName,
    issueDate: now,
    lastUpdate: now,
    status: 'Verified Success',
    skillLevel: targetSkillLevel,
    reassessmentsPassed: 0
  }

  saveCertificates(certs)
  return { success: true, certId: newCertId, upgraded: false, currentLevel: targetSkillLevel }
}

export function verifyCertificate(certId) {
  const certs = getCertificates()
  return certs[certId] || null
}
