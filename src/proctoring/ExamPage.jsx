import { useCallback, useEffect, useRef, useState } from 'react'
import { startProctoringLoop } from './ProctoringEngine'
import { initBrowserLockdown } from './BrowserLockdown'
import { createAudioMonitor } from './AudioMonitor'
import { createViolationTracker } from './ViolationTracker'
import './ExamPage.css'

const EXAM_QUESTIONS = [
  { id: 1, type: 'mcq', question: 'Which data structure uses LIFO (Last In, First Out) ordering?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correct: 1 },
  { id: 2, type: 'mcq', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1 },
  { id: 3, type: 'mcq', question: 'Which keyword is used to define a function in Python?', options: ['func', 'function', 'def', 'lambda'], correct: 2 },
  { id: 4, type: 'mcq', question: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Hyperlink Text Transmission Protocol', 'Host Transfer Transfer Protocol'], correct: 0 },
  { id: 5, type: 'mcq', question: 'Which of the following is NOT a Python data type?', options: ['dict', 'list', 'array', 'tuple'], correct: 2 },
]

const EXAM_DURATION = 30 * 60 // 30 minutes in seconds

export default function ExamPage({ storedDescriptor, studentName = 'Student', onExamComplete }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const procLoopRef = useRef(null)
  const audioMonRef = useRef(null)
  const lockdownRef = useRef(null)
  const trackerRef = useRef(null)

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION)
  const [violation, setViolation] = useState({ count: 0, type: null })
  const [warning, setWarning] = useState(null) // { level, message }
  const [micActive, setMicActive] = useState(false)
  const [camActive, setCamActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [examStarted, setExamStarted] = useState(false)

  const handleViolation = useCallback((type, details) => {
    const tracker = trackerRef.current
    if (!tracker) return
    tracker.addViolation(type, details)
    setViolation({ count: tracker.getWarningCount(), type })
  }, [])

  const showWarning = useCallback((level, message) => {
    setWarning({ level, message })
    setTimeout(() => setWarning(null), 6000)
  }, [])

  const handleAutoSubmit = useCallback(() => {
    showWarning('red', 'Exam auto-submitted due to repeated violations.')
    setTimeout(() => submitExam(true), 3000)
  }, [])

  const submitExam = useCallback((autoSubmitted = false) => {
    procLoopRef.current?.stop()
    audioMonRef.current?.stop()
    lockdownRef.current?.cleanup()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})

    const tracker = trackerRef.current
    onExamComplete?.({
      answers,
      questions: EXAM_QUESTIONS,
      timeTaken: EXAM_DURATION - timeLeft,
      autoSubmitted,
      violations: tracker?.getLog() || [],
      riskScore: tracker?.getRiskScore() || 0,
      integrityStatus: tracker?.getStatus() || 'Clean',
      violationSummary: tracker?.getSummary() || {},
      audioSummary: audioMonRef.current?.getSummary() || {},
      livenessSummary: procLoopRef.current?.getLivenessSummary() || {},
    })
  }, [answers, timeLeft, onExamComplete])

  // Init everything
  useEffect(() => {
    const tracker = createViolationTracker(showWarning, handleAutoSubmit)
    trackerRef.current = tracker

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCamActive(true)
      } catch {
        showWarning('red', 'Camera permission denied. Your exam may be flagged.')
      }

      // Start audio monitor
      try {
        const audio = createAudioMonitor((type, detail) => handleViolation(type, detail))
        audioMonRef.current = audio
        await audio.start()
        setMicActive(true)
      } catch {
        showWarning('yellow', 'Microphone not accessible. Continuing without audio monitoring.')
      }

      // Start browser lockdown
      const lockdown = initBrowserLockdown((type, detail) => handleViolation(type, detail))
      lockdownRef.current = lockdown
      lockdown.enterFullscreen()
      setIsFullscreen(true)

      // Start proctoring loop (1-sec delay to ensure video is playing)
      setTimeout(() => {
        if (videoRef.current && storedDescriptor) {
          const loop = startProctoringLoop(videoRef.current, storedDescriptor, handleViolation)
          procLoopRef.current = loop
        }
      }, 1500)

      setExamStarted(true)
    }

    init()

    return () => {
      procLoopRef.current?.stop()
      audioMonRef.current?.stop()
      lockdownRef.current?.cleanup()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, []) // eslint-disable-line

  // Fullscreen change tracking
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Timer countdown
  useEffect(() => {
    if (!examStarted) return
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); submitExam(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [examStarted, submitExam])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const q = EXAM_QUESTIONS[currentQ]
  const timerUrgent = timeLeft < 300

  return (
    <div className="exam-shell">
      {/* Warning popup */}
      {warning && (
        <div className={`warning-popup warning-${warning.level}`} role="alert">
          <span>{warning.level === 'yellow' ? '⚠️' : '🚨'}</span>
          <p>{warning.message}</p>
          <button type="button" onClick={() => setWarning(null)}>✕</button>
        </div>
      )}

      {/* Top bar */}
      <header className="exam-topbar">
        <div className="topbar-left">
          <span className="student-name">👤 {studentName}</span>
          <span className="identity-badge">✅ Identity Verified</span>
        </div>
        <div className={`exam-timer ${timerUrgent ? 'urgent' : ''}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <div className="topbar-right">
          <span className={`status-pill ${isFullscreen ? 'good' : 'bad'}`}>🖥 {isFullscreen ? 'Fullscreen ON' : 'NOT Fullscreen'}</span>
          <span className={`status-pill ${micActive ? 'good' : 'bad'}`}>🎤 {micActive ? 'Mic ON' : 'Mic OFF'}</span>
          <span className={`status-pill ${violation.count === 0 ? 'good' : violation.count < 3 ? 'warn' : 'bad'}`}>
            ⚠ Violations: {violation.count}
          </span>
        </div>
      </header>

      <div className="exam-body">
        {/* Left: Question navigation */}
        <aside className="question-nav">
          <h4>Questions</h4>
          <div className="question-dots">
            {EXAM_QUESTIONS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`q-dot ${i === currentQ ? 'active' : ''} ${answers[i] !== undefined ? 'answered' : ''}`}
                onClick={() => setCurrentQ(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="nav-legend">
            <span className="dot answered" /> Answered
            <span className="dot active" /> Current
            <span className="dot" /> Unanswered
          </div>
        </aside>

        {/* Center: Question */}
        <main className="question-main">
          <div className="question-card">
            <div className="q-meta">
              <span className="q-number">Question {currentQ + 1} of {EXAM_QUESTIONS.length}</span>
              <span className="q-type">MCQ</span>
            </div>
            <h2 className="q-text">{q.question}</h2>
            <div className="options-grid">
              {q.options.map((option, idx) => (
                <button
                  key={option}
                  type="button"
                  className={`option-btn ${answers[currentQ] === idx ? 'selected' : ''}`}
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentQ]: idx }))}
                >
                  <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="question-actions">
            <button type="button" className="nav-btn ghost" onClick={() => setCurrentQ((q) => Math.max(0, q - 1))} disabled={currentQ === 0}>
              ← Previous
            </button>
            {currentQ < EXAM_QUESTIONS.length - 1 ? (
              <button type="button" className="nav-btn primary" onClick={() => setCurrentQ((q) => q + 1)}>
                Next →
              </button>
            ) : (
              <button type="button" className="nav-btn submit" onClick={() => submitExam(false)}>
                Submit Exam ✓
              </button>
            )}
          </div>
        </main>

        {/* Right: Webcam + status */}
        <aside className="proctor-sidebar">
          <div className="webcam-preview-box">
            <video ref={videoRef} autoPlay muted playsInline className="proctor-video" />
            <div className="cam-label">📷 Live Monitoring</div>
          </div>
          <div className="sidebar-status">
            <div className="status-item">
              <span>Camera</span>
              <span className={camActive ? 'active' : 'inactive'}>{camActive ? '● ON' : '● OFF'}</span>
            </div>
            <div className="status-item">
              <span>Microphone</span>
              <span className={micActive ? 'active' : 'inactive'}>{micActive ? '● ON' : '● OFF'}</span>
            </div>
            <div className="status-item">
              <span>Fullscreen</span>
              <span className={isFullscreen ? 'active' : 'inactive'}>{isFullscreen ? '● ON' : '● OFF'}</span>
            </div>
            <div className="status-item">
              <span>Violations</span>
              <span className={violation.count === 0 ? 'active' : 'warn'}>{violation.count} / 3</span>
            </div>
          </div>
          <div className="answered-count">
            {Object.keys(answers).length} / {EXAM_QUESTIONS.length} answered
          </div>
        </aside>
      </div>
    </div>
  )
}
