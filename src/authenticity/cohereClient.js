export const fetchCohereAuthenticitySignals = async ({
  answer,
  question,
  lessonTitle,
  courseName,
}) => {
  const response = await fetch('/api/authenticity/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer,
      question,
      lessonTitle,
      courseName,
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload.ok) {
    const errorMessage = payload?.error || 'Authenticity analysis service unavailable.'
    throw new Error(errorMessage)
  }

  return payload.result
}
