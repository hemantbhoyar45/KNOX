import { useEffect, useState } from 'react'
import LoginPage from './LoginPage'
import StudentDashboard from './StudentDashboard'
import LearningFlowPage from './LearningFlowPage'
import ProctorFlow from './proctoring/ProctorFlow'
import CertificateView from './certificates/CertificateView'
import CertificateVerificationPage from './certificates/CertificateVerificationPage'
import CodingPracticeModule from './coding/CodingModule'
import './App.css'

function App() {
  const getRouteFromPath = () => {
    if (window.location.pathname === '/login') {
      return '/login'
    }

    if (window.location.pathname === '/dashboard') {
      return '/dashboard'
    }

    if (window.location.pathname === '/learning') {
      return '/learning'
    }

    if (window.location.pathname === '/exam') {
      return '/exam'
    }

    if (window.location.pathname === '/practice') {
      return '/practice'
    }

    if (window.location.pathname.startsWith('/certificate/')) {
      return window.location.pathname
    }

    if (window.location.pathname.startsWith('/verify/')) {
      return window.location.pathname
    }

    return '/'
  }

  const [route, setRoute] = useState(() => getRouteFromPath())
  const [learningContext, setLearningContext] = useState({
    courseName: 'Python for Automation',
    lessonTitle: 'Functions, Loops, and Real-World Scripting',
    instructor: 'Priya Nair',
  })

  const stats = [
    { value: '10K+', label: 'LEARNERS', icon: 'people' },
    { value: '500+', label: 'COURSES', icon: 'book' },
    { value: 'AI Verified', label: 'CERTIFICATES', icon: 'badge' },
  ]

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRouteFromPath())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const navigateTo = (nextPath) => {
    if (route === nextPath) {
      return
    }

    window.history.pushState({}, '', nextPath)
    setRoute(nextPath)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openLearningFlow = (context) => {
    setLearningContext(context)
    navigateTo('/learning')
  }

  if (route === '/login') {
    return (
      <LoginPage
        onBackHome={() => navigateTo('/')}
        onSignIn={() => navigateTo('/dashboard')}
      />
    )
  }

  if (route === '/dashboard') {
    return (
      <StudentDashboard
        onGoHome={() => navigateTo('/')}
        onLogOut={() => navigateTo('/login')}
        onResumeCourse={openLearningFlow}
        onTakeExam={() => navigateTo('/exam')}
        onOpenPractice={() => navigateTo('/practice')}
      />
    )
  }

  if (route === '/practice') {
    return (
      <CodingPracticeModule
        completedCourses={['Data Structures & Algorithms', 'Python for Automation']}
        onBack={() => navigateTo('/dashboard')}
      />
    )
  }

  if (route === '/exam') {
    return (
      <ProctorFlow
        studentName="Atharv Bhavsar"
        onExit={() => navigateTo('/dashboard')}
      />
    )
  }

  if (route === '/learning') {
    return (
      <LearningFlowPage
        lessonContext={learningContext}
        onBackDashboard={() => navigateTo('/dashboard')}
      />
    )
  }

  if (route.startsWith('/certificate/')) {
    const certId = route.split('/')[2]
    return <CertificateView certId={certId} onBack={() => navigateTo('/dashboard')} />
  }

  if (route.startsWith('/verify/')) {
    // The component manages its own ID extraction so just render it. This is usually public.
    return <CertificateVerificationPage />
  }

  return (
    <div className="page-shell">
      <header className="top-nav">
        <a
          className="logo"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            navigateTo('/')
          }}
        >
          <span className="logo-mark">⚡</span>
          <span>KNOX</span>
        </a>

        <nav className="nav-links" aria-label="Primary navigation">
          <a
            className="active"
            href="/"
            onClick={(event) => {
              event.preventDefault()
              navigateTo('/')
            }}
          >
            Home
          </a>
          <a href="#">Courses</a>
          <a href="#">Enterprise</a>
        </nav>

        <div className="nav-actions">
          <a
            href="/login"
            onClick={(event) => {
              event.preventDefault()
              navigateTo('/login')
            }}
          >
            Log In
          </a>
          <button type="button" onClick={() => navigateTo('/login')}>
            Get Started
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <p className="eyebrow">AI-Powered Learning</p>
          <h1>
            Learn Smarter.
            <br />
            <span>Prove It.</span>
          </h1>
          <p className="hero-copy">
            Adaptive courses, real-time progress tracking, and verified mastery
            all in one platform. Empower your journey with the intelligence of
            tomorrow.
          </p>

          <div className="hero-actions">
            <button type="button" className="primary">
              Start Learning Free
              <span aria-hidden="true">→</span>
            </button>
            <a href="#" className="watch-demo">
              <span className="dot" aria-hidden="true"></span>
              Watch Demo
            </a>
          </div>

          <div className="stats-row" aria-label="Platform statistics">
            {stats.map((item) => (
              <article className="stat-card" key={item.label}>
                <div className="stat-icon" aria-hidden="true" data-icon={item.icon} />
                <h2>{item.value}</h2>
                <p>{item.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="intelligence-card">
          <div>
            <h3>The Intelligence Layer</h3>
            <p>
              Unlike traditional platforms, KNOX analyzes your learning patterns
              in real-time. Our proprietary algorithms identify knowledge gaps
              before they become obstacles, personalizing your curriculum every
              step of the way.
            </p>
            <div className="chip-row">
              <span>PREDICTIVE ANALYTICS</span>
              <span>DYNAMIC SCAFFOLDING</span>
            </div>
          </div>

          <div className="visual-panel" aria-hidden="true">
            <div className="pulse"></div>
            <div className="core">⚙</div>
          </div>
        </section>
      </main>

      <footer className="page-footer">
        <div>
          <p className="footer-brand">KNOX</p>
          <p>© 2024 KNOX. All rights reserved.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </nav>
        <div className="footer-icons" aria-hidden="true">
          <span>◎</span>
          <span>◈</span>
        </div>
      </footer>
    </div>
  )
}

export default App
