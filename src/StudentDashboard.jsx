import './StudentDashboard.css'

const activeCourses = [
  {
    title: 'Python for Automation',
    instructor: 'Priya Nair',
    progress: 54,
    lesson: 'Functions, Loops, and Real-World Scripting',
    duration: '22 min left',
    hue: 'indigo',
    image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=600&auto=format&fit=crop', // Hacker code style
  },
  {
    title: 'Python Data Analysis Basics',
    instructor: 'Chai Aur Code',
    progress: 41,
    lesson: 'List Comprehensions and Data Cleanup',
    duration: '19 min left',
    hue: 'teal',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwMcfyVmfJNemVg4mKm_wdGa2x_RCptbw8UA&s', // Analytics computer screens
  },
  {
    title: 'Data Structures & Algorithms',
    instructor: 'Love Babbar ',
    progress: 28,
    lesson: 'Trees, Graphs, and Pathfinding',
    duration: '1h 12m left',
    hue: 'purple',
    image: 'https://imgs.search.brave.com/JJ6LPiGP7yKX95Kd7qU-2Wj1gcdrZ1yp3ghkcSvHYs0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9yZXBv/c2l0b3J5LWltYWdl/cy5naXRodWJ1c2Vy/Y29udGVudC5jb20v/NTYyOTI0MzYzLzdm/Y2QxN2E2LWFmYjYt/NGYxOC05MGU4LThi/ZWY2Y2FkYzNmMg', // Abstract code networks or algorithm vibe
  },
]

const enrolledCourses = [
  { title: 'Data Structures Mastery', status: 'Completed', score: '98%' },
  { title: 'Prompt Engineering Lab', status: 'Active', score: '63%' },
  { title: 'Python for Automation', status: 'Active', score: '54%' },
  { title: 'Cloud Basics for Students', status: 'Completed', score: '100%' },
  { title: 'Design Thinking for Builders', status: 'Not Started', score: '--' },
  { title: 'SQL Bootcamp', status: 'Active', score: '39%' },
]

const nextLessons = [
  'Finish Project State Management in React Patterns',
  'Practice Gradient Descent Quiz in ML Foundations',
  'Review AI feedback on your last capstone submission',
]

const recommendations = [
  {
    title: 'Deep Learning Essentials',
    reason: 'Matches your ML learning velocity',
    level: 'Intermediate',
  },
  {
    title: 'System Design for New Engineers',
    reason: 'Strong fit based on completed architecture tracks',
    level: 'Beginner+',
  },
  {
    title: 'Product Analytics with SQL',
    reason: 'Recommended from your data pathway profile',
    level: 'Intermediate',
  },
]

function StudentDashboard({ onGoHome, onLogOut, onResumeCourse, onTakeExam, onOpenPractice }) {
  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <a
          className="dashboard-logo"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onGoHome()
          }}
        >
          <span>⚡</span>
          <span>KNOX</span>
        </a>

        <label className="dashboard-search" htmlFor="dashboard-search-input">
          <span aria-hidden="true">⌕</span>
          <input
            id="dashboard-search-input"
            type="search"
            placeholder="Search courses, lessons, instructors"
          />
        </label>

        <div className="dashboard-actions">
          <button type="button" className="icon-btn" aria-label="Notifications">
            🔔
          </button>
          <button type="button" className="icon-btn" aria-label="Quick menu">
            ☰
          </button>
          <div className="student-pill" aria-label="Student profile">
            <span className="avatar">AR</span>
            <div>
              <p className="student-name">Athar</p>
              <p className="student-role">Student</p>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={onLogOut}>
            Log Out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="welcome-card">
          <div>
            <p className="welcome-tag">Welcome Back</p>
            <h1>Keep your momentum, Atharv</h1>
            <p>
              You are on a 12-day streak. Every focused session sharpens your
              edge. Let us continue where you left off.
            </p>
          </div>
          <div className="summary-grid">
            <article>
              <p>Learning Streak</p>
              <strong>12 Days</strong>
            </article>
            <article>
              <p>Weekly Progress</p>
              <strong>74%</strong>
            </article>
            <article>
              <p>Completed Courses</p>
              <strong>8</strong>
            </article>
            <article>
              <p>Study Hours</p>
              <strong>46h</strong>
            </article>
          </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={onTakeExam}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.35)'
                }}
              >
                🛡 Take Proctored Exam
              </button>
            </div>
        </section>

        <section className="continue-section">
          <div className="section-head">
            <h2>Continue Learning</h2>
            <a href="#">View all active courses</a>
          </div>
          <div className="continue-grid">
            {activeCourses.map((course) => (
              <article className="continue-card" key={course.title} data-hue={course.hue}>
                <div 
                  className="thumbnail" 
                  aria-hidden="true" 
                  style={{ 
                    backgroundImage: `url(${course.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                ></div>
                <div className="card-body">
                  <p className="tiny">{course.instructor}</p>
                  <h3>{course.title}</h3>
                  <div className="progress-line" role="progressbar" aria-valuenow={course.progress} aria-valuemin="0" aria-valuemax="100">
                    <span style={{ width: `${course.progress}%` }}></span>
                  </div>
                  <p className="tiny">{course.progress}% complete</p>
                  <p className="last-lesson">Last lesson: {course.lesson}</p>
                  <div className="continue-row">
                    <p>{course.duration}</p>
                    <button
                      type="button"
                      onClick={() =>
                        onResumeCourse({
                          courseName: course.title,
                          lessonTitle: course.lesson,
                          instructor: course.instructor,
                        })
                      }
                    >
                      Resume
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="courses-section">
          <div className="section-head">
            <h2>My Courses</h2>
            <a href="#">Manage learning plan</a>
          </div>

          <div className="courses-grid">
            {enrolledCourses.map((course) => (
              <article className="course-card" key={course.title}>
                <h3>{course.title}</h3>
                <p>Status: {course.status}</p>
                <p>Progress: {course.score}</p>
                <button type="button">Open Course</button>
              </article>
            ))}
          </div>
        </section>

        <section className="recommend-wrap">
          <article className="next-lesson-card">
            <div className="section-head">
              <h2>Recommended Next Lessons</h2>
            </div>
            <ul>
              {nextLessons.map((lesson) => (
                <li key={lesson}>{lesson}</li>
              ))}
            </ul>
          </article>

          <article className="recommended-card">
            <div className="section-head">
              <h2>Recommended Courses</h2>
            </div>
            <div className="recommend-grid">
              {recommendations.map((course) => (
                <article className="recommend-item" key={course.title}>
                  <p className="level">{course.level}</p>
                  <h3>{course.title}</h3>
                  <p>{course.reason}</p>
                  <button type="button">Preview Course</button>
                </article>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default StudentDashboard
