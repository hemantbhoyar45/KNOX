import { useEffect, useMemo, useRef, useState } from 'react'
import ReactPlayer from 'react-player'
import { buildAuthenticityReport } from './authenticity/authenticityEngine'
import { fetchCohereAuthenticitySignals } from './authenticity/cohereClient'
import PracticeModule from './PracticeModule'
import InlineProctoring from './proctoring/InlineProctoring'
import { issueOrUpdateCertificate } from './certificates/CertificateManager'
import './LearningFlowPage.css'

const DEFAULT_LESSON_VIDEO_URL = 'https://www.youtube.com/watch?v=kqtD5dpn9C8'

const LESSON_MODULES = [
  '1. Python Fundamentals and Variables',
  '2. Flow Control and Loop Thinking',
  '3. Functions and Data Structures',
  '4. Explainability and Problem Breakdown',
  '5. Practice Lab and Validation',
  '6. Beginner Certification Exam',
  '7. Intermediate Certification Exam',
  '8. Expert Certification Exam',
]

const QUIZ_ITEMS = [
  {
    id: 'q1',
    type: 'mcq',
    question:
      'In Python, when should you create a function during problem solving?',
    options: [
      'Only when your code uses classes',
      'When repeated logic appears and needs reuse or clarity',
      'Only for file operations',
      'When loops fail to run',
    ],
    correct: 'When repeated logic appears and needs reuse or clarity',
  },
  {
    id: 'q2',
    type: 'truefalse',
    question:
      'Predicting loop output before executing code improves Python debugging.',
    options: ['True', 'False'],
    correct: 'True',
  },
  {
    id: 'q3',
    type: 'short',
    question:
      'A Python list-processing script is slow. What is your first diagnosis step?',
    keywordHints: ['input', 'loop', 'complexity', 'profile', 'optimize'],
  },
  {
    id: 'q4',
    type: 'mcq',
    question:
      'Which action best reflects the Feynman method in software learning?',
    options: [
      'Memorizing syntax quickly',
      'Copying production snippets',
      'Explaining the idea in simple words and examples',
      'Skipping theory and solving only challenges',
    ],
    correct: 'Explaining the idea in simple words and examples',
  },
]

function LearningFlowPage({ lessonContext, onBackDashboard }) {
  const playerRef = useRef(null)
  const questionStartRef = useRef(0)
  const explanationStartRef = useRef(0)
  const durationRef = useRef(0)
  const lastVideoTimeRef = useRef(0)
  const maxWatchedTimeRef = useRef(0)
  const lastInteractionRef = useRef(Date.now())
  const [activeModule, setActiveModule] = useState(2)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const [videoEnded, setVideoEnded] = useState(false)
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [stage, setStage] = useState('quiz')
  const [quizIndex, setQuizIndex] = useState(0)
  const [draftAnswer, setDraftAnswer] = useState('')
  const [draftConfidence, setDraftConfidence] = useState('medium')
  const [answerChanges, setAnswerChanges] = useState(0)
  const [quizResponses, setQuizResponses] = useState([])
  const [explanationText, setExplanationText] = useState('')
  const [didPaste, setDidPaste] = useState(false)
  const [warningText, setWarningText] = useState('')
  const [authResult, setAuthResult] = useState(null)
  const [isAnalyzingAuth, setIsAnalyzingAuth] = useState(false)
  const [authServiceError, setAuthServiceError] = useState('')
  const [reportReady, setReportReady] = useState(false)
  const [videoLoadError, setVideoLoadError] = useState(false)
  const [certResult, setCertResult] = useState(null)

  const [engagement, setEngagement] = useState({
    rewinds: 0,
    pauses: 0,
    idleSeconds: 0,
    skips: 0,
    replayedSegments: 0,
    retries: 0,
    answerTimeTotal: 0,
  })

  const [activeTab, setActiveTab] = useState('notes')

  const currentQuestion = QUIZ_ITEMS[quizIndex]
  const lessonVideoUrl = lessonContext?.videoUrl || DEFAULT_LESSON_VIDEO_URL

  // The cert issuance logic is completely ripped out from the Lesson module
  // and moved into the 6, 7, and 8 Modules directly.

  useEffect(() => {
    const updateActivity = () => {
      lastInteractionRef.current = Date.now()
    }

    window.addEventListener('mousemove', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('click', updateActivity)

    return () => {
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('click', updateActivity)
    }
  }, [])

  useEffect(() => {
    const timerId = setInterval(() => {
      if (!isVideoPlaying || videoEnded) {
        return
      }

      const idleFor = (Date.now() - lastInteractionRef.current) / 1000
      if (idleFor > 8) {
        setEngagement((prev) => ({
          ...prev,
          idleSeconds: prev.idleSeconds + 1,
        }))
      }
    }, 1000)

    return () => clearInterval(timerId)
  }, [isVideoPlaying, videoEnded])

  useEffect(() => {
    questionStartRef.current = performance.now()
  }, [quizIndex])

  const handleSeeked = (seconds) => {
    const delta = seconds - lastVideoTimeRef.current

    if (delta < -2) {
      setEngagement((prev) => ({ ...prev, rewinds: prev.rewinds + 1 }))
    }

    if (delta > 18) {
      setEngagement((prev) => ({ ...prev, skips: prev.skips + 1 }))
    }

    if (seconds < maxWatchedTimeRef.current - 6) {
      setEngagement((prev) => ({
        ...prev,
        replayedSegments: prev.replayedSegments + 1,
      }))
    }

    lastVideoTimeRef.current = seconds
  }

  const handleTimeUpdate = (state) => {
    const seconds = state.playedSeconds
    lastVideoTimeRef.current = seconds

    if (seconds > maxWatchedTimeRef.current) {
      maxWatchedTimeRef.current = seconds
    }
  }

  const handlePause = () => {
    setIsVideoPlaying(false)
    setEngagement((prev) => ({ ...prev, pauses: prev.pauses + 1 }))
  }

  const handlePlay = () => {
    setIsVideoPlaying(true)
  }

  const handleDuration = (durationSeconds) => {
    durationRef.current = durationSeconds
  }

  const handleVideoEnd = () => {
    setIsVideoPlaying(false)
    setVideoEnded(true)
    setAssessmentOpen(true)
    setStage('quiz')
    questionStartRef.current = performance.now()
  }

  const computeAnswerCorrectness = (question, answer) => {
    if (question.type === 'short') {
      const normalized = answer.toLowerCase()
      const hitCount = question.keywordHints.filter((keyword) =>
        normalized.includes(keyword),
      ).length
      return hitCount >= 2
    }

    return answer === question.correct
  }

  const confidenceToNumber = (confidence) => {
    if (confidence === 'high') {
      return 1
    }

    if (confidence === 'low') {
      return 0.4
    }

    return 0.7
  }

  const handleNextQuestion = () => {
    const answerValue = draftAnswer.trim()
    if (!answerValue) {
      return
    }

    const elapsed = (performance.now() - questionStartRef.current) / 1000
    const isCorrect = computeAnswerCorrectness(currentQuestion, answerValue)
    const hesitation = answerChanges > 1 || elapsed > 35

    setEngagement((prev) => ({
      ...prev,
      answerTimeTotal: prev.answerTimeTotal + elapsed,
    }))

    setQuizResponses((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        answer: answerValue,
        confidence: draftConfidence,
        confidenceNumeric: confidenceToNumber(draftConfidence),
        timeSeconds: elapsed,
        hesitation,
        correct: isCorrect,
      },
    ])

    setDraftAnswer('')
    setDraftConfidence('medium')
    setAnswerChanges(0)

    if (quizIndex < QUIZ_ITEMS.length - 1) {
      setQuizIndex((prev) => prev + 1)
      return
    }

    setStage('explain')
    explanationStartRef.current = performance.now()
  }

  const renderHighlightedExplanation = () => {
    if (!authResult || !explanationText.trim()) {
      return null
    }

    const highlightedSet = new Set(
      (authResult.highlightedWords || []).map((word) => word.toLowerCase()),
    )

    return explanationText.split(/(\s+)/).map((chunk, index) => {
      const normalized = chunk.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (normalized && highlightedSet.has(normalized)) {
        return (
          <mark className="ai-highlight" key={`${chunk}-${index}`}>
            {chunk}
          </mark>
        )
      }

      return <span key={`${chunk}-${index}`}>{chunk}</span>
    })
  }

  const handleAnalyzeExplanation = async () => {
    if (!explanationText.trim()) {
      return
    }

    setIsAnalyzingAuth(true)
    setAuthServiceError('')

    try {
      const responseSeconds = (performance.now() - explanationStartRef.current) / 1000
      const cohereSignals = await fetchCohereAuthenticitySignals({
        answer: explanationText,
        question: 'Explain the lesson concept in your own words.',
        lessonTitle: lessonContext?.lessonTitle,
        courseName: lessonContext?.courseName,
      })

      const result = buildAuthenticityReport({
        answer: explanationText,
        didPaste,
        responseSeconds,
        answerChanges,
        cohereSignals,
      })

      setAuthResult(result)

      if (result.styleMetrics.wordCount < 10) {
        setWarningText(
          'Your response is too short. Please provide a more detailed explanation in your own words.',
        )
        return
      }

      if (result.suspicious) {
        setWarningText(
          'Your response appears highly assisted or copied. Please answer in your own words for accurate skill evaluation.',
        )
        return
      }

      setWarningText('')
      setStage('result')
      setReportReady(true)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Authenticity service is unavailable right now.'

      setAuthServiceError(message)
      setWarningText('Unable to verify answer authenticity right now. Please try again.')
    } finally {
      setIsAnalyzingAuth(false)
    }
  }

  const handleRetryExplanation = () => {
    setExplanationText('')
    setDidPaste(false)
    setWarningText('')
    setAuthServiceError('')
    setAuthResult(null)
    setEngagement((prev) => ({ ...prev, retries: prev.retries + 1 }))
    explanationStartRef.current = performance.now()
  }

  const proceedWithCurrentExplanation = () => {
    if (!authResult) {
      return
    }

    setWarningText('')
    setStage('result')
    setReportReady(true)
  }

  const report = useMemo(() => {
    const total = quizResponses.length || 1
    const correct = quizResponses.filter((item) => item.correct).length
    const quizScore = Math.round((correct / total) * 100)
    const confidenceAvg =
      quizResponses.reduce((sum, item) => sum + item.confidenceNumeric, 0) / total

    const explanationQuality = Math.min(
      100,
      Math.round((explanationText.trim().split(/\s+/).filter(Boolean).length / 28) * 100),
    )

    const conceptUnderstanding = Math.round(quizScore * 0.72 + explanationQuality * 0.28)
    const authenticityScore = authResult ? authResult.finalScore : 0

    const engagementPenalty =
      engagement.rewinds * 2 +
      engagement.pauses * 1.2 +
      engagement.skips * 5 +
      engagement.idleSeconds * 0.25 +
      engagement.retries * 4

    const engagementScore = Math.max(0, Math.round(100 - engagementPenalty))

    let learnerState = 'strong understanding'
    if (engagementScore < 50 || engagement.skips > 3) {
      learnerState = 'disengaged'
    } else if (quizScore < 55 || confidenceAvg < 0.55) {
      learnerState = 'struggling'
    } else if (engagement.rewinds > 4 || engagement.pauses > 7) {
      learnerState = 'confused'
    }

    const confidenceLabel =
      confidenceAvg > 0.82 ? 'high' : confidenceAvg > 0.6 ? 'moderate' : 'low'

    const strengths =
      quizScore >= 75
        ? 'You showed strong transfer understanding in core reasoning questions.'
        : 'You showed partial understanding, but some concept transitions need reinforcement.'

    const weakSignal =
      learnerState === 'confused' || learnerState === 'struggling'
        ? `Your behavior and response pattern indicate uncertainty with some core concepts in ${lessonContext?.courseName || 'the lesson'}.`
        : 'Your behavior indicates stable flow with manageable cognitive load.'

    const authenticitySummary = authResult?.suspicious
      ? `Written explanation shows authenticity risk (${authResult.suspiciousLevel}). RoBERTa semantic signals and the ML classifier both detected assisted-writing patterns.`
      : 'Written explanation appears genuine. RoBERTa semantic review and ML classifier indicate student-like response behavior.'

    const nextAction =
      learnerState === 'strong understanding'
        ? 'Continue to the next lesson and attempt one applied coding challenge.'
        : learnerState === 'confused'
          ? 'Rewatch key timeline moments and retry one targeted practice block.'
          : learnerState === 'struggling'
            ? 'Review the concept map and complete guided reinforcement exercises before proceeding.'
            : 'Take a short focused break, then revisit the lesson with active note prompts.'

    return {
      quizScore,
      conceptUnderstanding,
      authenticityScore,
      engagementScore,
      confidenceLabel,
      learnerState,
      strengths,
      weakSignal,
      authenticitySummary,
      nextAction,
    }
  }, [authResult, engagement, explanationText, quizResponses])

  const authenticitySignals = useMemo(() => {
    const wordCount = explanationText.trim().split(/\s+/).filter(Boolean).length
    const cohere = authResult?.cohereSignals

    return {
      pastedText: didPaste ? 'Detected' : 'Not detected',
      responseSpeed: authResult ? `${authResult.responseSeconds}s` : 'Pending',
      vocabularyJump: authResult?.vocabularyJump ? 'Yes' : 'No',
      aiPhrasingHits: authResult ? authResult.aiPhraseHits : 0,
      mlSuspicionScore: authResult?.mlSuspicionScore ?? 'Pending',
      cohereAiProbability: cohere ? `${cohere.aiProbability}%` : 'Pending',
      cohereOriginality: cohere ? `${cohere.originalityScore}%` : 'Pending',
      semanticFit: cohere ? `${cohere.semanticFitScore}%` : 'Pending',
      wordCount,
    }
  }, [authResult, didPaste, explanationText])

  const denominator = durationRef.current > 0 ? durationRef.current : 600
  const videoProgress =
    videoEnded ? 100 : Math.min(98, Math.round((maxWatchedTimeRef.current / denominator) * 100))

  return (
    <div className="learning-shell">
      <header className="learning-topbar">
        <button type="button" onClick={onBackDashboard}>
          ← Back to Dashboard
        </button>
        <div className="flow-principle">
          <span>System Forces Thinking</span>
          <p>Predict → Explain → Continue</p>
        </div>
      </header>

      <main className="learning-layout">
        <aside className="module-sidebar">
          <h3>Lesson Modules</h3>
          <ul>
            {LESSON_MODULES.map((module, index) => (
              <li 
                key={module} 
                className={index === activeModule ? 'active' : ''}
                onClick={() => setActiveModule(index)}
                style={{ cursor: 'pointer' }}
              >
                {module}
              </li>
            ))}
          </ul>

          <section className="engagement-tracker">
            <h4>Engagement Tracker</h4>
            <p>Rewinds: {engagement.rewinds}</p>
            <p>Pauses: {engagement.pauses}</p>
            <p>Idle Time: {engagement.idleSeconds}s</p>
            <p>Skipped Segments: {engagement.skips}</p>
            <p>Replayed Segments: {engagement.replayedSegments}</p>
            <p>Assessment Retries: {engagement.retries}</p>
          </section>
        </aside>

        <section className="lesson-main">
          {activeModule === 4 ? (
            <PracticeModule masteryLevel={report?.learnerState === 'strong understanding' ? 'high' : 'low'} />
          ) : activeModule >= 5 ? (
            <div className="module-placeholder" style={{ padding: '6rem 2rem', textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '1rem' }}>
              <h2 style={{ color: '#0f172a', marginBottom: '0.5rem', fontSize: '2rem' }}>{LESSON_MODULES[activeModule].substring(3)}</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
                This is a proctored full-module milestone exam. Successful completion will permanently upgrade
                your live verified certificate level on the blockchain database.
              </p>

              {certResult && certResult.moduleMatch === activeModule ? (
                <div style={{ padding: '2rem', border: '1px solid #22c55e', borderRadius: '12px', background: 'rgba(34,197,94,0.05)', maxWidth: '400px', margin: '0 auto' }}>
                  <h3 style={{ color: '#16a34a', margin: '0 0 1rem 0' }}>✅ {certResult.upgraded ? 'Skill Upgraded' : 'Exam Passed'}</h3>
                  <p style={{ margin: '0 0 1.5rem 0', color: '#1e293b' }}>
                    Current Live Level: <strong>{certResult.currentLevel}</strong>
                  </p>
                  <button 
                    type="button" 
                    onClick={() => window.location.href = `/certificate/${certResult.certId}`}
                    style={{ background: '#22c55e', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', width: '100%', boxShadow: '0 4px 6px rgba(34,197,94,0.3)' }}
                  >
                    View Master QR Certificate
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    // Mapped: activeModule 5 -> Beginner, 6 -> Intermediate, 7 -> Expert
                    const targetLevel = activeModule === 5 ? 'Beginner' : activeModule === 6 ? 'Intermediate' : 'Expert'
                    const res = issueOrUpdateCertificate('Atharv Bhavsar', lessonContext?.courseName || 'Python for Automation', 0, targetLevel)
                    if (res.success) {
                      setCertResult({ ...res, moduleMatch: activeModule })
                    }
                  }}
                  style={{ background: '#0f172a', color: 'white', padding: '1rem 2rem', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  Simulate Exam Passing & Claim '{activeModule === 5 ? 'Beginner' : activeModule === 6 ? 'Intermediate' : 'Expert'}' Level
                </button>
              )}
            </div>
          ) : activeModule === 2 ? (
            <>
              <article className="video-card">
            <ReactPlayer
              ref={playerRef}
              className="lesson-video"
              src={lessonVideoUrl}
              controls
              width="100%"
              height="480px"
              config={{
                youtube: {
                  playerVars: {
                    rel: 0,
                    modestbranding: 1,
                  },
                },
              }}
              onReady={() => setVideoLoadError(false)}
              onError={() => setVideoLoadError(true)}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeeked}
              onProgress={handleTimeUpdate}
              onDuration={handleDuration}
              onEnded={handleVideoEnd}
            />

            {videoLoadError && (
              <div className="video-warning" role="alert">
                Unable to load video in the embedded player. 
                <div className="video-fallback-wrap">
                  <video
                    title="Educational Video Fallback"
                    controls
                    width="100%"
                    height="480px"
                  >
                    <source src={lessonVideoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            <div className="lesson-meta">
              <div>
                <p className="course-name">{lessonContext.courseName}</p>
                <h1>{lessonContext.lessonTitle}</h1>
                <p className="instructor-name">Instructor: {lessonContext.instructor}</p>
                <div className="concept-tags">
                  <span>Predictive Reasoning</span>
                  <span>Python Thinking</span>
                  <span>Feynman Validation</span>
                  <span>Cognitive Feedback</span>
                </div>
              </div>

              <div className="meta-right">
                <p>Lesson Progress</p>
                <div className="lesson-progress">
                  <span style={{ width: `${videoProgress}%` }}></span>
                </div>
                <p>{videoProgress}% watched</p>
              </div>
            </div>

            <div className="notes-switcher" role="tablist" aria-label="Learning tools">
              <button
                type="button"
                className={activeTab === 'notes' ? 'active' : ''}
                onClick={() => setActiveTab('notes')}
              >
                Notes
              </button>
              <button
                type="button"
                className={activeTab === 'bookmarks' ? 'active' : ''}
                onClick={() => setActiveTab('bookmarks')}
              >
                Bookmarks
              </button>
              <button
                type="button"
                className={activeTab === 'transcript' ? 'active' : ''}
                onClick={() => setActiveTab('transcript')}
              >
                Transcript
              </button>
            </div>

            <div className="tool-panel">
              {activeTab === 'notes' && (
                <p>
                  Take concise notes on what this concept predicts before coding.
                  Your notes improve your explanation quality score.
                </p>
              )}
              {activeTab === 'bookmarks' && (
                <p>
                  Bookmark difficult moments (loop control, function design,
                  list processing) for quick revision.
                </p>
              )}
              {activeTab === 'transcript' && (
                <p>
                  Transcript cue: "Predicting Python output before execution
                  improves problem-solving and reduces trial-and-error coding."
                </p>
              )}
            </div>
          </article>

          {assessmentOpen && (
            <section className="assessment-panel" aria-live="polite">
              <div className="assessment-head" style={{ marginBottom: '1rem' }}>
                <h2>Mandatory Understanding Check</h2>
                <p>You must complete this cognitive validation before progressing.</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ flex: 1 }}>
                  <h4>🔒 Strict Proctoring Mode Enabled</h4>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.5rem 0' }}>Camera, microphone, and browser activity are being continuously monitored. Tab switching or extensions are disabled.</p>
                  
                  {warningText && (
                    <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.5rem', animation: 'pulse 1.5s infinite' }}>
                      <strong>{warningText}</strong>
                    </div>
                  )}
                </div>
                <InlineProctoring 
                  strictMode={true} 
                  onViolation={(type, detail) => {
                    setWarningText(`Alert: ${detail}`)
                    setTimeout(() => setWarningText(''), 4000)
                  }} 
                />
              </div>

              {stage === 'quiz' && (
                <div className="quiz-block">
                  <p className="step-label">
                    Concept Understanding Quiz ({quizIndex + 1}/{QUIZ_ITEMS.length})
                  </p>
                  <h3>{currentQuestion.question}</h3>

                  {(currentQuestion.type === 'mcq' || currentQuestion.type === 'truefalse') && (
                    <div className="option-grid">
                      {currentQuestion.options.map((option) => (
                        <button
                          type="button"
                          key={option}
                          disabled={!!warningText}
                          className={draftAnswer === option ? 'selected' : ''}
                          onClick={() => {
                            if (!warningText) {
                              setDraftAnswer(option)
                              setAnswerChanges((prev) => prev + 1)
                            }
                          }}
                          style={{
                            opacity: warningText ? 0.5 : 1,
                            cursor: warningText ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'short' && (
                    <textarea
                      value={draftAnswer}
                      onChange={(event) => {
                        setDraftAnswer(event.target.value)
                        setAnswerChanges((prev) => prev + 1)
                      }}
                      placeholder="Write your application-focused answer"
                      rows={4}
                    />
                  )}

                  <div className="confidence-row">
                    <p>Your confidence:</p>
                    <div>
                      {['low', 'medium', 'high'].map((confidence) => (
                        <button
                          type="button"
                          key={confidence}
                          className={draftConfidence === confidence ? 'selected' : ''}
                          onClick={() => setDraftConfidence(confidence)}
                        >
                          {confidence}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="next-btn"
                    onClick={handleNextQuestion}
                    disabled={!draftAnswer.trim()}
                  >
                    {quizIndex === QUIZ_ITEMS.length - 1 ? 'Submit Quiz' : 'Next Question'}
                  </button>
                </div>
              )}

              {stage === 'explain' && (
                <div className="explain-block">
                  <p className="step-label">Feynman-Based Validation</p>
                  <h3>Explain this concept in your own words.</h3>
                  <p>
                    What did you understand from this lesson? Describe the main
                    idea briefly in a natural way.
                  </p>
                  <textarea
                    value={explanationText}
                    disabled={!!warningText}
                    rows={6}
                    onPaste={(e) => {
                      e.preventDefault() // block standard paste natively
                      setDidPaste(true)
                      setWarningText('Alert: COPY_PASTE attempt blocked')
                      setTimeout(() => setWarningText(''), 4000)
                    }}
                    onChange={(event) => {
                      if (!warningText) {
                        const newText = event.target.value
                        
                        // AGGRESSIVE ANTI-EXTENSION: Text Length Jump Check
                        // If they bypass the paste event using a browser extension that forces paste via JS value injection:
                        // No human can type 15+ characters in a single keystroke!
                        if (Math.abs(newText.length - explanationText.length) > 15) {
                           setDidPaste(true)
                           setWarningText('Alert: COPY_PASTE attempt blocked (Extension Bypass Detected)')
                           setTimeout(() => setWarningText(''), 4000)
                           return // DO NOT update the text state
                        }

                        setExplanationText(newText)
                        setAnswerChanges((prev) => prev + 1)
                      }
                    }}
                    placeholder={warningText ? 'Writing blocked! Please look at the screen.' : 'I understood that...'}
                    style={{ 
                      flex: 1, 
                      width: '100%',
                      border: warningText ? '2px solid #ef4444' : undefined,
                      opacity: warningText ? 0.7 : 1,
                      background: warningText ? 'rgba(239,68,68,0.1)' : undefined
                    }}
                  />

                  {/* Warning rendering handled globally above module */}

                  <div className="explain-actions">
                    <button
                      type="button"
                      onClick={handleAnalyzeExplanation}
                      disabled={isAnalyzingAuth || !explanationText.trim()}
                    >
                      {isAnalyzingAuth ? 'Analyzing with RoBERTa + ML...' : 'Analyze My Answer'}
                    </button>
                    <button type="button" className="ghost" onClick={handleRetryExplanation}>
                      Retry Fresh Response
                    </button>
                    {authResult?.suspicious && (
                      <button type="button" className="ghost" onClick={proceedWithCurrentExplanation}>
                        Use This Response Anyway
                      </button>
                    )}
                  </div>

                  <div className="signal-card">
                    <h4>Cohere + ML Authenticity Tracking</h4>
                    <p>Paste detection: {authenticitySignals.pastedText}</p>
                    <p>Response speed: {authenticitySignals.responseSpeed}</p>
                    <p>Vocabulary jump: {authenticitySignals.vocabularyJump}</p>
                    <p>AI-like phrasing hits: {authenticitySignals.aiPhrasingHits}</p>
                    <p>ML suspicion score: {authenticitySignals.mlSuspicionScore}</p>
                    <p>Cohere AI probability: {authenticitySignals.cohereAiProbability}</p>
                    <p>Cohere originality score: {authenticitySignals.cohereOriginality}</p>
                    <p>Semantic fit score: {authenticitySignals.semanticFit}</p>
                    <p>Word count: {authenticitySignals.wordCount}</p>
                    {authResult && (
                      <>
                        <p>
                          AI-generated likelihood: {authResult.aiContentPercent}%
                        </p>
                        <p>
                          Highlighted signals: {authResult.matchedPhrases.join(', ') || 'None'}
                        </p>
                        <p>
                          Cohere rationale: {authResult.cohereSignals.rationale}
                        </p>
                      </>
                    )}
                  </div>

                  {authServiceError && <p className="service-note">Service: {authServiceError}</p>}

                  {authResult && (
                    <div className="highlight-preview">
                      <h4>Flagged Wording Preview</h4>
                      <p>{renderHighlightedExplanation()}</p>
                    </div>
                  )}
                </div>
              )}

              {stage === 'result' && reportReady && (
                <div className="report-block">
                  <h3>Personalized Learning Report</h3>

                  <div className="report-grid">
                    <article>
                      <p>Lesson Completed</p>
                      <strong>Yes</strong>
                    </article>
                    <article>
                      <p>Quiz Score</p>
                      <strong>{report.quizScore}%</strong>
                    </article>
                    <article>
                      <p>Concept Understanding</p>
                      <strong>{report.conceptUnderstanding}%</strong>
                    </article>
                    <article>
                      <p>Authenticity Score</p>
                      <strong>{report.authenticityScore}%</strong>
                    </article>
                    <article>
                      <p>Engagement Score</p>
                      <strong>{report.engagementScore}%</strong>
                    </article>
                    <article>
                      <p>Confidence Level</p>
                      <strong>{report.confidenceLabel}</strong>
                    </article>
                  </div>

                  <div className="feedback-panels">
                    <article>
                      <h4>Cognitive Feedback</h4>
                      <p>{report.strengths}</p>
                      <p>{report.weakSignal}</p>
                      <p>{report.authenticitySummary}</p>
                      <p>Learner state inferred: {report.learnerState}</p>
                    </article>
                    <article>
                      <h4>Improvement Guidance</h4>
                      <p>{report.nextAction}</p>
                      <p>
                        Suggested practice: Build a mini example that predicts
                        the logic execution before coding, and explain it in 3 lines.
                      </p>
                      <p>
                        AI tutor tip: Use a predict-first checklist for each new
                        problem you solve in {lessonContext?.courseName || 'this subject'}.
                      </p>
                    </article>
                  </div>

                  <div className="report-actions">
                    <button type="button" onClick={onBackDashboard}>
                      Continue to Dashboard
                    </button>
                    {/* Certificate issuance removed from here per user request. Available in modules 6, 7, 8 */}
                    <button type="button" className="ghost" onClick={handleRetryExplanation}>
                      Retry Explanation
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        setStage('quiz')
                        setAssessmentOpen(true)
                        setQuizIndex(0)
                        setQuizResponses([])
                        setDraftAnswer('')
                        setWarningText('')
                        setAuthResult(null)
                        setReportReady(false)
                        setEngagement((prev) => ({ ...prev, retries: prev.retries + 1 }))
                        questionStartRef.current = performance.now()
                      }}
                    >
                      Revisit Assessment
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {!videoEnded && (
            <section className="flow-lock-note">
              <p>
                Progress lock enabled: You cannot continue until video completion
                + cognitive validation is finished.
              </p>
            </section>
          )}
            </>
          ) : (
            <div className="module-placeholder" style={{ padding: '6rem 2rem', textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '1rem' }}>
              <h2 style={{ color: '#64748b', marginBottom: '0.5rem' }}>Module Locked</h2>
              <p style={{ color: '#94a3b8' }}>Please complete the preceding modules first to unlock this content.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default LearningFlowPage
