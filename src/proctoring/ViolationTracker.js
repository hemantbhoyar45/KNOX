// Centralized violation logging and threshold enforcement

const VIOLATION_WEIGHTS = {
  TAB_SWITCH: 15,
  FULLSCREEN_EXIT: 15,
  FACE_ABSENT: 10,
  MULTIPLE_FACES: 20,
  IDENTITY_MISMATCH: 30,
  LOOKING_AWAY: 5,
  LOUD_AUDIO: 3,
  COPY_PASTE: 10,
  DEVTOOLS: 15,
  SPOOF_DETECTED: 25,
  RIGHT_CLICK: 5,
}

export function createViolationTracker(onWarning, onAutoSubmit) {
  const log = []
  let warningCount = 0

  const addViolation = (type, details = '') => {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      severity: VIOLATION_WEIGHTS[type] >= 15 ? 'high' : VIOLATION_WEIGHTS[type] >= 10 ? 'medium' : 'low',
      details,
    }
    log.push(entry)
    warningCount++

    if (warningCount === 1) {
      onWarning?.('yellow', `Warning: ${formatType(type)} detected. Please follow exam rules.`)
    } else if (warningCount === 2) {
      onWarning?.('red', `Serious Warning: Multiple violations detected. One more violation will auto-submit your exam.`)
    } else if (warningCount >= 3) {
      onAutoSubmit?.()
    }

    return entry
  }

  const getRiskScore = () => {
    const raw = log.reduce((sum, v) => sum + (VIOLATION_WEIGHTS[v.type] || 5), 0)
    return Math.min(100, raw)
  }

  const getStatus = () => {
    const score = getRiskScore()
    if (score <= 20) return 'Clean'
    if (score <= 45) return 'Mildly Suspicious'
    if (score <= 70) return 'Suspicious'
    return 'High Risk'
  }

  const getSummary = () => {
    const counts = {}
    for (const entry of log) {
      counts[entry.type] = (counts[entry.type] || 0) + 1
    }
    return counts
  }

  const formatType = (type) => type.replace(/_/g, ' ').toLowerCase()

  return {
    addViolation,
    getLog: () => [...log],
    getRiskScore,
    getStatus,
    getSummary,
    getWarningCount: () => warningCount,
  }
}
