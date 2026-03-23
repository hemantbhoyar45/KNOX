import { useState } from 'react'
import './PracticeModule.css'

const QUESTIONS = {
  hard: [
    {
      id: 'h1',
      difficulty: 'Hard',
      text: 'You need to process a 10GB log file and filter out error lines without crashing the server. Which approach is most memory-efficient in Python?',
      options: [
        'Read entire file into a list using .readlines()',
        'Use a generator to process the file line by line',
        'Load the file using list comprehensions to filter instantly',
        'Parse the file as a single giant string and use split("\\n")',
      ],
      correctIndex: 1,
      explanation:
        'Generators process items lazily (yield), meaning only one line of the 10GB file is loaded into physical RAM at any given time. Reading the whole file at once will crash the server from Out-Of-Memory errors.',
    },
    {
      id: 'h2',
      difficulty: 'Hard',
      text: 'Which function signature correctly defines a decorator that can accept an arbitrary number of positional and keyword arguments for the function it wraps?',
      options: [
        'def wrapper(func, *args, **kwargs):',
        'def decorator(func): def wrapper(*args, **kwargs): return func(*args, **kwargs) return wrapper',
        'def my_decorator(*args): return map(func, args)',
        'def wrapper(**kwargs): return func(**kwargs)',
      ],
      correctIndex: 1,
      explanation:
        'A proper decorator accepts the function first, then defines an inner wrapper function that captures *args and **kwargs, calls the original function, and returns the wrapper.',
    },
  ],
  medium: [
    {
      id: 'm1',
      difficulty: 'Medium',
      text: 'Which Python loop structure is safest and most idiomatic when you need to iterate directly over a list of system files?',
      options: [
        'A while loop where you manually increment a counter',
        'A recursive function that pops the last file from the list array',
        'A "for file in file_list:" loop structure',
        'A try/except block parsing indices one by one',
      ],
      correctIndex: 2,
      explanation:
        'A Python for-in loop is an "iterator loop" that abstracts away manual indexing or modifying the array, making it the safest and most expressive idiomatic choice.',
    },
  ],
  easy: [
    {
      id: 'e1',
      difficulty: 'Easy',
      text: 'What is the correct syntax for a basic loop that prints numbers from 0 to 4 in Python?',
      options: [
        'loop i from 0 to 4: print(i)',
        'for i in range(5): print(i)',
        'while item in range(4): print(i)',
        'for 5 times: print(i)',
      ],
      correctIndex: 1,
      explanation:
        'The range(5) function mathematically acts like a sequence from 0 to 4, and the for...in loop cleanly iterates through each integer one by one.',
    },
  ],
}

export default function PracticeModule({ masteryLevel = 'high' }) {
  const [stage, setStage] = useState('active')
  const [difficulty, setDifficulty] = useState(masteryLevel === 'high' ? 'hard' : 'easy')
  const [qIndex, setQIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [feedback, setFeedback] = useState(null)
  
  const currentQuestionQueue = QUESTIONS[difficulty] || QUESTIONS.easy
  const currentQuestion = currentQuestionQueue[qIndex] || currentQuestionQueue[0]

  const handleSelect = (index) => {
    if (stage !== 'active') return
    setSelectedOption(index)
  }

  const handleSubmit = () => {
    if (selectedOption === null) return

    const isCorrect = selectedOption === currentQuestion.correctIndex
    
    // Core adaptive logic flow implementation
    if (difficulty === 'hard') {
      if (isCorrect) {
        setFeedback({
          type: 'success',
          title: 'Excellent work!',
          detail: 'You mastered this advanced concept. Keep it up!',
          nextActionType: 'hard',
          buttonLabel: 'Try Another Advanced Challenge'
        })
      } else {
        setFeedback({
          type: 'error',
          title: 'Not quite right.',
          detail: `Let's dial it back. Explanation: ${currentQuestion.explanation}`,
          nextActionType: 'easy',
          buttonLabel: 'Practice Basics'
        })
      }
    } else if (difficulty === 'easy') {
      if (isCorrect) {
        setFeedback({
          type: 'success',
          title: 'Good job!',
          detail: 'You have the basics down. Let\'s step it up to a Medium question.',
          nextActionType: 'medium',
          buttonLabel: 'Move to Medium'
        })
      } else {
        setFeedback({
          type: 'warning',
          title: 'Concept Revision Needed.',
          detail: `Hint: ${currentQuestion.explanation}`,
          nextActionType: 'easy-retry',
          buttonLabel: 'Retry Basics'
        })
      }
    } else if (difficulty === 'medium') {
      if (isCorrect) {
        setFeedback({
          type: 'success',
          title: 'Strong improvement!',
          detail: 'Your concept mastery is returning. You are ready to tackle harder application problems again.',
          nextActionType: 'hard',
          buttonLabel: 'Retry Harder Problems'
        })
      } else {
        setFeedback({
          type: 'error',
          title: 'Incorrect.',
          detail: `Explanation: ${currentQuestion.explanation}`,
          nextActionType: 'easy',
          buttonLabel: 'Review Basics'
        })
      }
    }

    setStage('feedback')
  }

  const handleNext = () => {
    const action = feedback.nextActionType

    if (action === 'hard') {
      const nextIndex = qIndex + 1 < QUESTIONS.hard.length ? qIndex + 1 : 0
      setDifficulty('hard')
      setQIndex(nextIndex)
    } else if (action === 'medium') {
      setDifficulty('medium')
      setQIndex(0)
    } else if (action === 'easy') {
      setDifficulty('easy')
      setQIndex(0)
    } else if (action === 'easy-retry') {
      setDifficulty('easy')
      setQIndex(0)
    }

    setStage('active')
    setSelectedOption(null)
    setFeedback(null)
  }

  if (!currentQuestion) return null

  return (
    <section className="practice-module" aria-labelledby="practice-heading">
      <div className="practice-header">
        <h2 id="practice-heading">Practice Questions</h2>
        <span className={`difficulty-badge diff-${difficulty.toLowerCase()}`}>
          Level: {currentQuestion.difficulty}
        </span>
      </div>

      <div className="practice-card">
        <h3 className="practice-question-text">{currentQuestion.text}</h3>

        <div className="practice-options" role="radiogroup">
          {currentQuestion.options.map((option, idx) => {
            let itemClass = 'practice-option'
            if (selectedOption === idx) itemClass += ' selected'
            
            if (stage === 'feedback') {
              if (idx === currentQuestion.correctIndex) {
                itemClass += ' correct'
              } else if (selectedOption === idx && idx !== currentQuestion.correctIndex) {
                itemClass += ' wrong'
              }
              itemClass += ' disabled'
            }

            return (
              <button
                key={option}
                type="button"
                className={itemClass}
                onClick={() => handleSelect(idx)}
                disabled={stage !== 'active'}
                role="radio"
                aria-checked={selectedOption === idx}
              >
                <div className="option-indicator"></div>
                <span>{option}</span>
              </button>
            )
          })}
        </div>

        {stage === 'active' && (
          <div className="practice-actions">
            <button 
              type="button" 
              className="practice-submit"
              onClick={handleSubmit}
              disabled={selectedOption === null}
            >
              Check Answer
            </button>
          </div>
        )}

        {stage === 'feedback' && feedback && (
          <div className={`practice-feedback is-${feedback.type}`}>
            <div className="feedback-content">
              <h4>{feedback.title}</h4>
              <p>{feedback.detail}</p>
            </div>
            
            <div className="feedback-actions">
              <button type="button" onClick={handleNext}>
                {feedback.buttonLabel}
              </button>
              {feedback.nextActionType === 'easy-retry' && (
                <button type="button" className="ghost" onClick={() => {}}>
                  Revisit Concept Video
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
