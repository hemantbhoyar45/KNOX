// Liveness detection using blink detection + micro-movement analysis
// Uses face-api.js landmarks

// Eye Aspect Ratio (EAR) for blink detection
// EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
function getEAR(eye) {
  const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  const vertical1 = dist(eye[1], eye[5])
  const vertical2 = dist(eye[2], eye[4])
  const horizontal = dist(eye[0], eye[3])
  return (vertical1 + vertical2) / (2 * horizontal)
}

export function createLivenessDetector() {
  let blinkCount = 0
  let lastEAR = 0.3
  let wasEyeClosed = false
  const noseTipHistory = []
  let checkCount = 0

  const processLandmarks = (landmarks) => {
    checkCount++

    // --- Blink Detection ---
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    const leftEAR = getEAR(leftEye)
    const rightEAR = getEAR(rightEye)
    const avgEAR = (leftEAR + rightEAR) / 2

    if (avgEAR < 0.21 && !wasEyeClosed) {
      wasEyeClosed = true
    } else if (avgEAR > 0.25 && wasEyeClosed) {
      wasEyeClosed = false
      blinkCount++
    }
    lastEAR = avgEAR

    // --- Micro-movement (nose tip tracking) ---
    const nose = landmarks.getNose()
    const noseTip = nose[3] // 4th point is the tip
    noseTipHistory.push({ x: noseTip.x, y: noseTip.y, t: Date.now() })

    // Keep only last 30 frames (about 15 seconds at 2Hz)
    if (noseTipHistory.length > 30) {
      noseTipHistory.shift()
    }
  }

  const getHeadYaw = (landmarks) => {
    const nose = landmarks.getNose()
    const jaw = landmarks.getJawOutline()
    const noseTip = nose[3]
    const jawLeft = jaw[0]
    const jawRight = jaw[jaw.length - 1]
    const jawCenter = (jawLeft.x + jawRight.x) / 2
    const jawWidth = jawRight.x - jawLeft.x
    if (jawWidth === 0) return 0
    const offset = (noseTip.x - jawCenter) / jawWidth
    return offset * 90 // rough degrees
  }

  const getMicroMovementVariance = () => {
    if (noseTipHistory.length < 5) return 0
    const xs = noseTipHistory.map((p) => p.x)
    const ys = noseTipHistory.map((p) => p.y)
    const avgX = xs.reduce((a, b) => a + b, 0) / xs.length
    const avgY = ys.reduce((a, b) => a + b, 0) / ys.length
    const varianceX = xs.reduce((sum, x) => sum + (x - avgX) ** 2, 0) / xs.length
    const varianceY = ys.reduce((sum, y) => sum + (y - avgY) ** 2, 0) / ys.length
    return Math.sqrt(varianceX + varianceY)
  }

  const isLikelySpoof = () => {
    // If no blinks in 30+ checks (~15 seconds) AND no micro-movement → suspicious
    if (checkCount > 10 && blinkCount === 0 && getMicroMovementVariance() < 0.5) {
      return true
    }
    return false
  }

  const getSummary = () => ({
    blinkCount,
    microMovementVariance: Math.round(getMicroMovementVariance() * 100) / 100,
    checkCount,
    livenessStatus: isLikelySpoof() ? 'Suspicious (possible spoof)' : 'Passed',
  })

  return { processLandmarks, getHeadYaw, isLikelySpoof, getSummary, getBlinkCount: () => blinkCount }
}
