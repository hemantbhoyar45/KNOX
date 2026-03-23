import { useState } from 'react'
import './ProctoringReport.css'

const STATUS_CONFIG = {
  Clean: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: '✅' },
  'Mildly Suspicious': { color: '#eab308', bg: 'rgba(234,179,8,0.1)', icon: '⚠️' },
  Suspicious: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: '🚨' },
  'High Risk': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '🔴' },
}

function ScoreRing({ score }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const filled = circ - (score / 100) * circ
  const color = score <= 20 ? '#22c55e' : score <= 45 ? '#eab308' : score <= 70 ? '#f97316' : '#ef4444'

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={r} fill="none"
        stroke={color} strokeWidth="12"
        strokeDasharray={circ}
        strokeDashoffset={filled}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
      <text x="70" y="66" textAnchor="middle" fill={color} fontSize="28" fontWeight="900">{score}</text>
      <text x="70" y="85" textAnchor="middle" fill="#64748b" fontSize="11">Risk Score</text>
    </svg>
  )
}

function StatCard({ label, value, icon, flag }) {
  return (
    <div className={`stat-card ${flag ? 'flagged' : ''}`}>
      <span className="stat-icon">{icon}</span>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )
}

export default function ProctoringReport({ data, studentName = 'Student', onFinish, onViewCertificate }) {
  if (!data) return null

  const {
    riskScore = 0,
    integrityStatus = 'Clean',
    violationSummary = {},
    audioSummary = {},
    livenessSummary = {},
    autoSubmitted = false,
    timeTaken = 0,
    answers = {},
    questions = [],
  } = data

  const config = STATUS_CONFIG[integrityStatus] || STATUS_CONFIG['Clean']
  const correctAnswers = questions.filter((q, i) => answers[i] === q.correct).length
  const scorePercent = Math.round((correctAnswers / Math.max(questions.length, 1)) * 100)
  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`

  return (
    <div className="report-shell">
      <div className="report-container">
        <header className="report-header">
          <div>
            <h1>📋 Proctoring Report</h1>
            <p className="report-meta">Student: <strong>{studentName}</strong> · {new Date().toLocaleString()}</p>
          </div>
          {autoSubmitted && (
            <div className="auto-submit-badge">⚡ Auto-Submitted</div>
          )}
        </header>

        {/* Risk Score Ring + Status */}
        <div className="integrity-banner" style={{ background: config.bg, borderColor: config.color }}>
          <ScoreRing score={riskScore} />
          <div className="integrity-text">
            <span className="integrity-icon">{config.icon}</span>
            <h2 style={{ color: config.color }}>{integrityStatus}</h2>
            <p>Exam Integrity Status</p>
            <div className="quiz-score">Quiz Score: <strong>{scorePercent}%</strong> ({correctAnswers}/{questions.length})</div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="report-grid">
          <StatCard icon="🔄" label="Tab Switches" value={violationSummary.TAB_SWITCH || 0} flag={(violationSummary.TAB_SWITCH || 0) > 0} />
          <StatCard icon="🖥" label="Fullscreen Exits" value={violationSummary.FULLSCREEN_EXIT || 0} flag={(violationSummary.FULLSCREEN_EXIT || 0) > 0} />
          <StatCard icon="👤" label="Face Absences" value={violationSummary.FACE_ABSENT || 0} flag={(violationSummary.FACE_ABSENT || 0) > 1} />
          <StatCard icon="👥" label="Multiple Faces" value={violationSummary.MULTIPLE_FACES || 0} flag={(violationSummary.MULTIPLE_FACES || 0) > 0} />
          <StatCard icon="👀" label="Looking Away" value={violationSummary.LOOKING_AWAY || 0} flag={(violationSummary.LOOKING_AWAY || 0) > 3} />
          <StatCard icon="🎤" label="Audio Events" value={audioSummary.speechEvents || 0} flag={(audioSummary.speechEvents || 0) > 10} />
          <StatCard icon="📋" label="Copy/Paste Attempts" value={violationSummary.COPY_PASTE || 0} flag={(violationSummary.COPY_PASTE || 0) > 0} />
          <StatCard icon="🔧" label="DevTools Attempts" value={violationSummary.DEVTOOLS || 0} flag={(violationSummary.DEVTOOLS || 0) > 0} />
          <StatCard icon="👁" label="Blink Count" value={livenessSummary.blinkCount ?? '—'} />
          <StatCard icon="🛡" label="Liveness Status" value={livenessSummary.livenessStatus || 'Passed'} flag={livenessSummary.livenessStatus?.includes('Suspicious')} />
          <StatCard icon="🚫" label="Spoof Detected" value={violationSummary.SPOOF_DETECTED || 0} flag={(violationSummary.SPOOF_DETECTED || 0) > 0} />
          <StatCard icon="⏱" label="Time Taken" value={formatTime(timeTaken)} />
        </div>

        {/* Audio metric */}
        {audioSummary.totalChecks > 0 && (
          <div className="audio-bar-section">
            <p className="section-label">🎤 Audio Activity During Exam</p>
            <div className="audio-bar-track">
              <div className="audio-bar-fill" style={{ width: `${audioSummary.speechPercentage || 0}%` }} />
            </div>
            <p className="audio-bar-label">{audioSummary.speechPercentage || 0}% of exam time with speech/audio detected</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="report-disclaimer">
          <p>⚠️ This AI proctoring report is an automated assessment aid. The integrity status is determined by weighted behavioral signals and should be reviewed by a human instructor before taking disciplinary action.</p>
        </div>

        <div className="report-actions">
          <button type="button" className="finish-btn" onClick={onFinish}>
            Return to Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}
