import './LoginPage.css'

function LoginPage({ onBackHome, onSignIn }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSignIn()
  }

  return (
    <div className="login-shell">
      <header className="login-topbar">
        <button type="button" className="back-home" onClick={onBackHome}>
          ← Back To Home
        </button>
        <a
          className="login-logo"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onBackHome()
          }}
        >
          ⚡ KNOX
        </a>
      </header>

      <main className="login-layout">
        <section className="login-card">
          <p className="login-tag">Student Portal</p>
          <h1>Welcome back, learner</h1>
          <p className="login-copy">
            Sign in to continue your courses, review your progress, and unlock
            verified certificates.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="student-email">Email Address</label>
            <input
              id="student-email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
              required
            />

            <label htmlFor="student-password">Password</label>
            <input
              id="student-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />

            <div className="login-row">
              <label className="remember-check" htmlFor="remember-device">
                <input id="remember-device" type="checkbox" />
                Remember me
              </label>
              <a href="#">Forgot Password?</a>
            </div>

            <button type="submit" className="signin-btn">
              Sign In
            </button>
          </form>

          <p className="signup-copy">
            New student? <a href="#">Create your account</a>
          </p>
        </section>

        <aside className="benefits-panel" aria-label="Student advantages">
          <h2>What you get after login</h2>
          <ul>
            <li>AI-recommended next lessons tailored to your pace.</li>
            <li>Daily streak tracking and milestone reminders.</li>
            <li>Verified certificates ready for sharing and job profiles.</li>
          </ul>
        </aside>
      </main>
    </div>
  )
}

export default LoginPage
