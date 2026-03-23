// Core proctoring engine: face monitoring loop using face-api.js
import * as faceapi from 'face-api.js'
import { createLivenessDetector } from './LivenessDetector'

let modelsLoaded = false

export async function loadFaceModels() {
  if (modelsLoaded) return
  const MODEL_URL = '/models'
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
  modelsLoaded = true
}

// Extract a 128-d face descriptor from a video element or image
export async function extractFaceDescriptor(input) {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!detection) return null
  return {
    descriptor: Array.from(detection.descriptor),
    landmarks: detection.landmarks,
  }
}

// Compare two face descriptors (returns distance, lower = more similar)
export function compareFaces(desc1, desc2) {
  const d1 = desc1 instanceof Float32Array ? desc1 : new Float32Array(desc1)
  const d2 = desc2 instanceof Float32Array ? desc2 : new Float32Array(desc2)
  return faceapi.euclideanDistance(d1, d2)
}

// Continuous proctoring loop
export function startProctoringLoop(videoElement, storedDescriptor, onViolation) {
  const liveness = createLivenessDetector()
  let intervalId = null
  let faceAbsentStreak = 0

  const runCheck = async () => {
    try {
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors()

      // --- No face detected ---
      if (detections.length === 0) {
        faceAbsentStreak++
        if (faceAbsentStreak >= 2) {
          onViolation('FACE_ABSENT', `No face detected for ${faceAbsentStreak * 3} seconds`)
        }
        return
      }
      faceAbsentStreak = 0

      // --- Multiple faces ---
      if (detections.length > 1) {
        onViolation('MULTIPLE_FACES', `${detections.length} faces detected in frame`)
      }

      const primary = detections[0]

      // --- Identity check ---
      if (storedDescriptor) {
        const distance = compareFaces(storedDescriptor, primary.descriptor)
        if (distance > 0.6) {
          onViolation('IDENTITY_MISMATCH', `Face mismatch (distance: ${distance.toFixed(2)})`)
        }
      }

      // --- Head direction (looking away) ---
      const yaw = liveness.getHeadYaw(primary.landmarks)
      if (Math.abs(yaw) > 30) {
        onViolation('LOOKING_AWAY', `Head turned ${Math.round(yaw)}° away from screen`)
      }

      // --- Feed liveness detector ---
      liveness.processLandmarks(primary.landmarks)

      // --- Liveness / spoof check ---
      if (liveness.isLikelySpoof()) {
        onViolation('SPOOF_DETECTED', 'No blinks or movement detected — possible photo/video spoof')
      }
    } catch (err) {
      console.warn('Proctoring check error:', err)
    }
  }

  intervalId = setInterval(runCheck, 3000) // every 3 seconds

  const stop = () => {
    if (intervalId) clearInterval(intervalId)
    intervalId = null
  }

  return {
    stop,
    getLivenessSummary: () => liveness.getSummary(),
  }
}
