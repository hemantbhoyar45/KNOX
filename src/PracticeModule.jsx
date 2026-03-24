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
      explanation: 'Generators process items lazily (yield), loading only one line into physical RAM at any given time.',
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
      explanation: 'A proper decorator accepts the function first, then defines an inner wrapper function that captures *args and **kwargs.',
    },
    {
      id: 'h3',
      difficulty: 'Hard',
      text: 'What happens when a mutable default argument (like an empty list `def func(a=[])`) is used in a Python function?',
      options: [
        'A new list is created every time the function runs',
        'The list is shared across all calls that do not explicitly provide a new argument',
        'A syntax error is thrown immediately',
        'The list throws an Immutable exception when appended to',
      ],
      correctIndex: 1,
      explanation: 'Default mutable arguments are instantiated only once when the function is defined, meaning the same object is shared across calls.',
    },
    {
      id: 'h4',
      difficulty: 'Hard',
      text: 'What is the algorithmic time complexity of searching for an element in a correctly implemented Python set (`x in my_set`)?',
      options: [
        'O(N) - Linear',
        'O(log N) - Logarithmic',
        'O(1) - Constant (on average)',
        'O(N^2) - Quadratic',
      ],
      correctIndex: 2,
      explanation: 'Sets in Python are implemented using hash tables, allowing O(1) average time complexity for lookups.',
    }
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
      explanation: 'A Python for-in loop is an "iterator loop" that abstracts away manual indexing or modifying the array.',
    },
    {
      id: 'm2',
      difficulty: 'Medium',
      text: 'What is the main difference between a tuple and a list in Python?',
      options: [
        'Tuples can only store numbers',
        'Lists are faster than tuples',
        'Tuples are immutable, lists are mutable',
        'Lists execute using C++ while tuples use Java',
      ],
      correctIndex: 2,
      explanation: 'Tuples cannot be modified after creation (immutable). Lists can be appended to and modified.',
    },
    {
      id: 'm3',
      difficulty: 'Medium',
      text: 'Which comprehension method correctly creates a dictionary from a list of words `words` where the key is the word and the value is its length?',
      options: [
        '{w: length(w) in words}',
        '[w, len(w) for w in words]',
        '{w: len(w) for w in words}',
        'dict.map(words, len)',
      ],
      correctIndex: 2,
      explanation: '{key: value for item in list} is the standard syntax for creating a dictionary comprehension.',
    },
    {
      id: 'm4',
      difficulty: 'Medium',
      text: 'How can you open a file in Python such that it automatically closes even if an exception occurs during writing?',
      options: [
        'Using the `with open(filename) as file:` context manager',
        'Using try-catch blocks exclusively',
        'Using `file.write(auto_close=True)`',
        'Files ALWAYS close automatically in Python',
      ],
      correctIndex: 0,
      explanation: 'The `with` statement creates a context manager that securely handles opening and closing resources automatically.',
    }
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
      explanation: 'The range(5) function acts like a sequence from 0 to 4, and the for...in loop iterates through it cleanly.',
    },
    {
      id: 'e2',
      difficulty: 'Easy',
      text: 'Which operator is used to check if two variables point to the exact same object in memory?',
      options: [
        '==',
        '===',
        'is',
        'equals()',
      ],
      correctIndex: 2,
      explanation: 'The `is` keyword checks for object identity (memory address), whereas `==` checks for value equality.',
    },
    {
      id: 'e3',
      difficulty: 'Easy',
      text: 'Which keyword is used to define a function in Python?',
      options: [
        'function',
        'define',
        'def',
        'func',
      ],
      correctIndex: 2,
      explanation: 'In Python, `def` stands for define and is uniquely used to declare functions.',
    },
    {
      id: 'e4',
      difficulty: 'Easy',
      text: 'What happens when you add two strings together in Python? (`"hello" + "world"`)',
      options: [
        'It throws a TypeError',
        'It concatenates them into "helloworld"',
        'It parses them as variables',
        'It converts them into a list',
      ],
      correctIndex: 1,
      explanation: 'The plus operator concatenates strings seamlessly in Python.',
    }
  ],
}

export default function PracticeModule({ masteryLevel = 'high' }) {
  const [stage, setStage] = useState('active')
  const [difficulty, setDifficulty] = useState(masteryLevel === 'high' ? 'hard' : 'easy')
  const [indexes, setIndexes] = useState({ hard: 0, medium: 0, easy: 0 })
  const [selectedOption, setSelectedOption] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  
  const currentQuestionQueue = QUESTIONS[difficulty] || QUESTIONS.easy
  const qIndex = indexes[difficulty] % currentQuestionQueue.length
  const currentQuestion = currentQuestionQueue[qIndex]

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
          type: 'success', title: 'Excellent work!', detail: 'You mastered this advanced concept. Keep it up!', nextActionType: 'hard', buttonLabel: 'Try Another Advanced Challenge'
        })
      } else {
        setFeedback({
          type: 'error', title: 'Not quite right.', detail: `Let's dial it back. Hint: ${currentQuestion.explanation}`, nextActionType: 'medium', buttonLabel: 'Practice Medium Level'
        })
      }
    } else if (difficulty === 'medium') {
      if (isCorrect) {
        setFeedback({
          type: 'success', title: 'Strong improvement!', detail: 'Your concept mastery is returning. You are ready to tackle harder application problems again.', nextActionType: 'hard', buttonLabel: 'Move up to Hard'
        })
      } else {
        setFeedback({
          type: 'error', title: 'Incorrect.', detail: `Hint: ${currentQuestion.explanation}`, nextActionType: 'easy', buttonLabel: 'Review Basics'
        })
      }
    } else if (difficulty === 'easy') {
       if (isCorrect) {
        setFeedback({
          type: 'success', title: 'Good job!', detail: "You have the basics down. Let's step it up to a Medium question.", nextActionType: 'medium', buttonLabel: 'Move to Medium'
        })
      } else {
        setFeedback({
          type: 'warning', title: 'Concept Revision Needed.', detail: `Hint: ${currentQuestion.explanation}`, nextActionType: 'easy-retry', buttonLabel: 'Retry Basics'
        })
      }
    }

    setStage('feedback')
  }

  const handleNext = () => {
    const nextTotal = questionsAnswered + 1
    
    if (nextTotal >= 10) {
      setStage('complete')
      return
    }

    setQuestionsAnswered(nextTotal)
    const action = feedback.nextActionType

    // Advance the index of the TARGET difficulty to guarantee a different question!
    if (action === 'hard') {
      setDifficulty('hard')
      setIndexes(prev => ({ ...prev, hard: prev.hard + 1 }))
    } else if (action === 'medium') {
      setDifficulty('medium')
      setIndexes(prev => ({ ...prev, medium: prev.medium + 1 }))
    } else if (action === 'easy') {
      setDifficulty('easy')
      setIndexes(prev => ({ ...prev, easy: prev.easy + 1 }))
    } else if (action === 'easy-retry') {
      setDifficulty('easy')
      setIndexes(prev => ({ ...prev, easy: prev.easy + 1 }))
    }

    setStage('active')
    setSelectedOption(null)
    setFeedback(null)
  }

  if (stage === 'complete') {
    return (
      <div className="practice-module" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#16a34a' }}>Practice Complete!</h2>
        <p style={{ color: '#64748b' }}>You successfully finished 10 adaptive questions. Your core logic pathways are primed.</p>
        <button type="button" onClick={() => window.location.reload()} style={{ display: 'inline-block', marginTop: '2rem', padding: '0.75rem 2rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Finish Lab</button>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <section className="practice-module" aria-labelledby="practice-heading">
      <div className="practice-header">
        <h2 id="practice-heading">Practice Questions ({questionsAnswered + 1}/10)</h2>
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
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
