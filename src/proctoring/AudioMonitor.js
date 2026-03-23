// Microphone monitoring using Web Audio API

export function createAudioMonitor(onViolation) {
  let audioCtx = null
  let analyser = null
  let intervalId = null
  let speechCount = 0
  let totalChecks = 0

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioCtx = new AudioContext()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    intervalId = setInterval(() => {
      analyser.getByteFrequencyData(dataArray)
      const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length)
      totalChecks++

      if (rms > 70) {
        onViolation('LOUD_AUDIO', `Loud audio detected (RMS: ${Math.round(rms)})`)
      }
      if (rms > 40) {
        speechCount++
      }
    }, 500)
  }

  const stop = () => {
    if (intervalId) clearInterval(intervalId)
    if (audioCtx) audioCtx.close().catch(() => {})
    intervalId = null
    audioCtx = null
    analyser = null
  }

  const getSummary = () => ({
    totalChecks,
    speechEvents: speechCount,
    speechPercentage: totalChecks > 0 ? Math.round((speechCount / totalChecks) * 100) : 0,
    micActive: !!intervalId,
  })

  return { start, stop, getSummary }
}
