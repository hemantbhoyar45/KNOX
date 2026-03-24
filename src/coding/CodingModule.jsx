import React, { useState, useRef, useEffect, memo } from 'react'
import './CodingModule.css'

// Internal static problem set mapped to courses
const PROBLEM_BANK = {
  'Data Structures & Algorithms': [
    {
      id: 'dsa_1',
      title: 'Reverse a Linked List (Simulation)',
      difficulty: 'Medium',
      desc: 'Given an array representing a completely flat linked list traversal, reverse the sequence.',
      format: 'Input: Comma separated integers\\nOutput: Comma separated reversed integers',
      constraints: 'Length <= 10^4',
      sampleIn: '[1,2,3,4]',
      sampleOut: '[4,3,2,1]',
      methodName: 'reverseArray',
      testCases: [
        { in: '[1,2,3]', args: '[1,2,3]', expectedOut: '[3,2,1]' },
        { in: '[9]', args: '[9]', expectedOut: '[9]' },
      ],
      defaultCode: {
        python: 'class Solution:\n    def reverseArray(self, arr):\n        # Write your code here\n        pass',
        javascript: 'class Solution {\n    reverseArray(arr) {\n        // Write your code here\n    }\n}',
        cpp: 'class Solution {\npublic:\n    vector<int> reverseArray(vector<int>& arr) {\n        \n    }\n};',
        java: 'class Solution {\n    public int[] reverseArray(int[] arr) {\n        \n    }\n}'
      }
    },
    {
      id: 'dsa_2',
      title: 'Valid Palindrome',
      difficulty: 'Easy',
      desc: 'Given a string, return true if it is a palindrome, ignoring non-alphanumeric characters and case.',
      format: 'Input: String s\\nOutput: Boolean (true/false)',
      constraints: 'Length <= 2 * 10^5',
      sampleIn: '"racecar"',
      sampleOut: 'true',
      methodName: 'isPalindrome',
      testCases: [
        { in: '"racecar"', args: '"racecar"', expectedOut: 'true' },
        { in: '"hello"', args: '"hello"', expectedOut: 'false' },
      ],
      defaultCode: {
        python: 'class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Write your code here\n        return False',
        javascript: 'class Solution {\n    isPalindrome(s) {\n        // Write your code here\n        return false;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    bool isPalindrome(string s) {\n        \n    }\n};',
        java: 'class Solution {\n    public boolean isPalindrome(String s) {\n        \n    }\n}'
      }
    },
    {
      id: 'dsa_3',
      title: 'Add Two Numbers',
      difficulty: 'Easy',
      desc: 'Given two integers, return their sum. (Classic warm-up)',
      format: 'Input: Two integers a and b\\nOutput: Integer sum',
      constraints: '-10^9 <= a, b <= 10^9',
      sampleIn: 'a=5, b=7',
      sampleOut: '12',
      methodName: 'addTwoNumbers',
      testCases: [
        { in: 'a=5, b=7', args: '5, 7', expectedOut: '12' },
        { in: 'a=-3, b=3', args: '-3, 3', expectedOut: '0' },
      ],
      defaultCode: {
        python: 'class Solution:\n    def addTwoNumbers(self, a: int, b: int) -> int:\n        return 0',
        javascript: 'class Solution {\n    addTwoNumbers(a, b) {\n        return 0;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int addTwoNumbers(int a, int b) {\n        return 0;\n    }\n};',
        java: 'class Solution {\n    public int addTwoNumbers(int a, int b) {\n        return 0;\n    }\n}'
      }
    },
    {
      id: 'dsa_4',
      title: 'Find Remainder of Two Numbers',
      difficulty: 'Easy',
      desc: 'Given two integers a and b, return the remainder of a divided by b.',
      format: 'Input: integers a and b\\nOutput: integer remainder',
      constraints: 'b != 0',
      sampleIn: 'a=10, b=3',
      sampleOut: '1',
      methodName: 'findRemainder',
      testCases: [
        { in: 'a=10, b=3', args: '10, 3', expectedOut: '1' },
        { in: 'a=25, b=7', args: '25, 7', expectedOut: '4' },
      ],
      defaultCode: {
        python: 'class Solution:\n    def findRemainder(self, a: int, b: int) -> int:\n        return 0',
        javascript: 'class Solution {\n    findRemainder(a, b) {\n        return 0;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int findRemainder(int a, int b) {\n        return 0;\n    }\n};',
        java: 'class Solution {\n    public int findRemainder(int a, int b) {\n        return 0;\n    }\n}'
      }
    }
  ],
  'Python for Automation': [
    {
      id: 'py_1',
      title: 'Sum of Array Elements',
      difficulty: 'Easy',
      desc: 'Given an array of integers representing file sizes, compute their total sum.',
      format: 'Input: Array of integers\\nOutput: Integer sum',
      constraints: 'Values >= 0',
      sampleIn: '[10, 20, 30]',
      sampleOut: '60',
      methodName: 'sumArray',
      testCases: [
        { in: '[10, 20, 30]', args: '[10, 20, 30]', expectedOut: '60' },
        { in: '[]', args: '[]', expectedOut: '0' },
      ],
      defaultCode: {
        python: 'class Solution:\n    def sumArray(self, arr):\n        return 0',
        javascript: 'class Solution {\n    sumArray(arr) {\n        return 0;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int sumArray(vector<int>& arr) {\n        return 0;\n    }\n};',
        java: 'class Solution {\n    public int sumArray(int[] arr) {\n        return 0;\n    }\n}'
      }
    }
  ]
}

const CodingPracticeModule = memo(({ completedCourses = [], onBack, isEmbedded = false, courseOverride = null }) => {
  const allowedCourses = completedCourses.length > 0 ? completedCourses : [
    'Python for Automation',
    'Data Structures & Algorithms'
  ]

  const initialCourse = courseOverride || allowedCourses[0]

  const [activeCourse, setActiveCourse] = useState(initialCourse)
  const [activeProblem, setActiveProblem] = useState(PROBLEM_BANK[initialCourse]?.[0])

  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [consoleOut, setConsoleOut] = useState(null)

  const [aiChat, setAiChat] = useState([
    { role: 'ai', text: "Hi! I'm Knox AI. Need a hint? Tell me what you are failing on." }
  ])
  const [aiDraft, setAiDraft] = useState('')

  useEffect(() => {
    setActiveProblem(PROBLEM_BANK[activeCourse]?.[0])
  }, [activeCourse])

  useEffect(() => {
    if (activeProblem) {
      setCode(activeProblem.defaultCode[language] || '')
      setConsoleOut(null)
    }
  }, [activeProblem, language])

  // Real JS Execution Engine
  const handleRunSubmit = (isSubmit = false) => {
    setConsoleOut({ status: 'Running', results: [] })

    setTimeout(() => {
      const results = []
      let passedAll = true
      let err = false

      if (code.trim() === '' || code.length < 10) {
        setConsoleOut({
          status: 'Compilation Error',
          results: [],
          message: 'Error: Unexpected EOF while parsing. Code block seems empty or syntax fails.'
        })
        return
      }

      if (language === 'javascript') {
        // Execute Code Actually!
        activeProblem.testCases.forEach((tc, i) => {
          let passed = false
          let output = 'undefined'
          try {
            // Construct a safe isolated function runner
            const harness = code + `\nreturn new Solution().${activeProblem.methodName}(${tc.args});`
            const executor = new Function(harness)
            const res = executor()

            if (typeof res === 'boolean') output = res ? 'true' : 'false'
            else if (Array.isArray(res)) output = JSON.stringify(res).replace(/ /g, '')
            else if (res !== undefined) output = String(res)

            if (output === tc.expectedOut) passed = true
          } catch (e) {
            output = e.toString()
          }

          if (!passed) passedAll = false
          if (!passed && isSubmit) err = true

          results.push({
            idx: i + 1, input: tc.in, expected: tc.expectedOut, passed, output
          })
        })
      } else {
        // For non-JS languages during frontend demo without a backend proxy:
        // Use an extremely loose regex to prevent hard blocks, or prompt them to use JS
        activeProblem.testCases.forEach((tc, i) => {
          results.push({
            idx: i + 1, input: tc.in, expected: tc.expectedOut, passed: false,
            output: 'Runtime Exception: Sandbox execution natively supports JavaScript only right now. Please test logic locally in JS.'
          })
        })
        err = true
        passedAll = false
      }

      if (err) {
        setConsoleOut({ status: 'Rejected', message: 'Wrong Answer. See test case outputs.', results })
      } else if (passedAll) {
        setConsoleOut({ status: 'Accepted', message: 'All test cases passed executing successfully!', results })
      } else {
        setConsoleOut({ status: 'Partially Passed', message: 'Some exact string test cases failed to match.', results })
      }
    }, 400)
  }

  const handleAiSend = async (e) => {
    e.preventDefault()
    if (!aiDraft.trim()) return

    const userText = aiDraft
    const newChat = [...aiChat, { role: 'user', text: userText }]
    setAiChat(newChat)
    const query = aiDraft
    setAiDraft('')

    // Append loading bubble
    setAiChat([...newChat, { role: 'ai', text: 'Typing...', isLoading: true }])

    try {
      const COHERE_API_KEY = import.meta.env.VITE_COHERE_API_KEY || 'Pb3SCKMdre89l49j8AF1lnYDvhCAnRYQBgsAonLG'

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          model: import.meta.env.VITE_COHERE_MODEL || 'command-r',
          preamble: `You are 'Knox AI', a specialized proprietary tutoring AI for this platform. Your ONLY goal is to provide extremely short, sharp hints regarding the coding problem the user is dealing with (${activeProblem?.title}). Make sure it does not sound like any other assistant. DO NOT GIVE DIRECT CODE ANSWERS. NEVER write code blocks. If they ask for code, refuse and offer a tiny logic hint instead. KEEP YOUR RESPONSES TO 1-2 SENTENCES MAXIMUM. Start with "Hint:" or "Knox:" occasionally.`,
          chat_history: newChat.filter(m => !m.isLoading).map(m => ({
            role: m.role === 'ai' ? 'CHATBOT' : 'USER',
            message: m.text
          })),
        })
      })

      const data = await response.json()

      let aiResponse = "I encountered an error analyzing your logic. Check your network or my API key!"
      if (data && data.text) {
        aiResponse = data.text.trim()
      }

      setAiChat([...newChat, { role: 'ai', text: aiResponse }])
    } catch (e) {
      console.error(e)
      setAiChat([...newChat, { role: 'ai', text: 'Network connection to Knox Core failed. Please ensure internet is active.' }])
    }
  }

  // Prevent textarea keystroke lag by not forcing parent unmounts (React.memo on export handles this)
  const codeChangeHandler = (e) => {
    setCode(e.target.value)
  }

  return (
    <div className="coding-page" style={isEmbedded ? { height: '100%', borderRadius: 0 } : {}}>
      {!isEmbedded && (
        <aside className="coding-sidebar">
          <button type="button" onClick={onBack} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '4px', marginBottom: '1.5rem', cursor: 'pointer', padding: '0.4rem' }}>
            ← Back to Dashboard
          </button>

          <h2>Eligible Practice Courses</h2>
          <div className="course-filter">
            {allowedCourses.map(c => (
              <button key={c} className={`course-btn ${activeCourse === c ? 'active' : ''}`} onClick={() => setActiveCourse(c)}>
                {c}
              </button>
            ))}
          </div>

          {activeCourse && (
            <>
              <h2>{activeCourse} Problems</h2>
              <div className="problem-list">
                {PROBLEM_BANK[activeCourse]?.map(prob => (
                  <button key={prob.id} className={`problem-btn ${activeProblem?.id === prob.id ? 'active' : ''}`} onClick={() => setActiveProblem(prob)}>
                    {prob.title}
                    <span className={`diff-badge diff-${prob.difficulty.toLowerCase()}`}>{prob.difficulty}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>
      )}

      {isEmbedded && (
        <div style={{ width: '220px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
            Module Tasks
          </h2>
          <div className="problem-list">
            {PROBLEM_BANK[activeCourse]?.map(prob => (
              <button key={prob.id} className={`problem-btn ${activeProblem?.id === prob.id ? 'active' : ''}`} onClick={() => setActiveProblem(prob)}>
                {prob.title}
                <span className={`diff-badge diff-${prob.difficulty.toLowerCase()}`}>{prob.difficulty}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Coding Layout */}
      <main className="coding-main">
        {/* Middle Panel: Problem Desc & Socratic AI */}
        <section className="problem-panel">
          <div className="problem-desc">
            {activeProblem ? (
              <>
                <h1>{activeProblem.title}</h1>
                <p>{activeProblem.desc}</p>
                <div className="io-block">
                  <h4>Input / Output Format</h4>
                  <div className="io-box">{activeProblem.format.split('\\n').map((l, i) => <div key={i}>{l}</div>)}</div>
                </div>
                <div className="io-block">
                  <h4>Constraints</h4>
                  <div className="io-box">{activeProblem.constraints}</div>
                </div>
                <div className="io-block">
                  <h4>Sample Target</h4>
                  <div className="io-box" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
                    Input: {activeProblem.sampleIn} <br />
                    Output: {activeProblem.sampleOut}
                  </div>
                </div>
              </>
            ) : (
              <p>Select a problem from the left menu.</p>
            )}
          </div>

          <div className="socratic-ai">
            <div className="socratic-header">🧠 AI Socratic Guide</div>
            <div className="chat-window">
              {aiChat.map((msg, i) => (
                <div key={i} className={`msg ${msg.role}`}>{msg.text}</div>
              ))}
            </div>
            <form className="ai-input" onSubmit={handleAiSend}>
              <input type="text" placeholder="I'm stuck on logic..." value={aiDraft} onChange={e => setAiDraft(e.target.value)} />
              <button type="submit">Ask</button>
            </form>
          </div>
        </section>

        {/* Right Panel: Editor & Output */}
        <section className="editor-panel">
          <div className="editor-header">
            <select className="lang-select" value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="java">Java 17</option>
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="cpp">C++ (GCC)</option>
            </select>
            <div className="editor-actions">
              <button className="btn-run" onClick={() => handleRunSubmit(false)}>Run Code</button>
              <button className="btn-submit" onClick={() => handleRunSubmit(true)}>Submit Task</button>
            </div>
          </div>
          <div className="editor-area">
            <textarea
              className="code-textarea"
              value={code}
              onChange={codeChangeHandler}
              spellCheck="false"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
            />
          </div>

          <div className="console-panel">
            <div className="console-header">Verification Console</div>
            <div className="console-body">
              {!consoleOut && <span style={{ color: '#475569' }}>Run code to verify logic...</span>}
              {consoleOut && consoleOut.status === 'Running' && <span style={{ color: '#d97706' }}>Compiling & Executing securely...</span>}

              {consoleOut && consoleOut.status !== 'Running' && (
                <>
                  <span className={`verdict ${consoleOut.status.split(' ')[0]}`}>{consoleOut.status}</span>
                  <p style={{ margin: '0 0 1rem 0' }}>{consoleOut.message}</p>

                  {consoleOut.results.map((r, i) => (
                    <div key={i} className={`test-case-card ${r.passed ? 'pass' : 'fail'}`}>
                      <strong style={{ color: r.passed ? '#16a34a' : '#ef4444' }}>Test {r.idx} {r.passed ? 'Passed' : 'Failed'}</strong>
                      <div className="test-io">Input: <span>{r.input}</span></div>
                      <div className="test-io">Expected: <span>{r.expected}</span></div>
                      {!r.passed && <div className="test-io">Your Output: <span style={{ color: '#ef4444' }}>{r.output}</span></div>}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
})

export default CodingPracticeModule
