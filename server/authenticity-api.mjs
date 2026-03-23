import { createServer } from 'node:http'

const PORT = Number(process.env.AUTH_API_PORT || 8787)
const COHERE_API_KEY = process.env.COHERE_API_KEY
const COHERE_MODEL = process.env.COHERE_MODEL || 'command-r-08-2024'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const json = (res, code, payload) => {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    ...CORS_HEADERS,
  })
  res.end(JSON.stringify(payload))
}

const parseBody = async (req) => {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }

  if (!chunks.length) {
    return {}
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}

const extractFirstJson = (text) => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

const clamp = (value, min = 0, max = 100) => {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, value))
}

const normalizeCohereOutput = (parsed) => {
  if (!parsed || typeof parsed !== 'object') {
    return null
  }

  return {
    aiProbability: clamp(Number(parsed.aiProbability ?? parsed.ai_probability ?? 50)),
    originalityScore: clamp(Number(parsed.originalityScore ?? parsed.originality_score ?? 50)),
    semanticFitScore: clamp(Number(parsed.semanticFitScore ?? parsed.semantic_fit_score ?? 50)),
    copyRiskScore: clamp(Number(parsed.copyRiskScore ?? parsed.copy_risk_score ?? 50)),
    languageNaturalness: clamp(
      Number(parsed.languageNaturalness ?? parsed.language_naturalness ?? 50),
    ),
    rationale:
      typeof parsed.rationale === 'string'
        ? parsed.rationale
        : 'Model-provided rationale unavailable.',
    suspiciousPhrases: Array.isArray(parsed.suspiciousPhrases)
      ? parsed.suspiciousPhrases.filter((item) => typeof item === 'string').slice(0, 8)
      : [],
  }
}

const buildPrompt = ({ question, answer, lessonTitle, courseName }) => {
  return [
    'You are evaluating short student answers in an adaptive learning platform.',
    'Return JSON only with keys:',
    '{',
    '  "aiProbability": number (0-100, higher means likely AI-assisted),',
    '  "originalityScore": number (0-100, higher means original student voice),',
    '  "semanticFitScore": number (0-100, alignment to question/lesson),',
    '  "copyRiskScore": number (0-100, higher means copy-paste risk),',
    '  "languageNaturalness": number (0-100, higher means naturally student-like),',
    '  "suspiciousPhrases": string[],',
    '  "rationale": string',
    '}',
    'Keep rationale under 45 words and avoid markdown.',
    `Course: ${courseName || 'Unknown'}`,
    `Lesson: ${lessonTitle || 'Unknown'}`,
    `Question: ${question || 'Explain the concept in your own words.'}`,
    `Student answer: ${answer}`,
  ].join('\n')
}

const analyzeWithCohere = async ({ question, answer, lessonTitle, courseName }) => {
  if (!COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY is missing.')
  }

  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: COHERE_MODEL,
      temperature: 0.1,
      message: buildPrompt({ question, answer, lessonTitle, courseName }),
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    console.error(`Cohere API Error Status: ${response.status}`)
    console.error(`Cohere API Error Payload:`, details)
    throw new Error(`Cohere request failed: ${response.status} ${details}`)
  }

  const payload = await response.json()

  // Cohere v1 /chat returns the text in payload.text directly
  const possibleText = payload?.text || ''

  const parsed = extractFirstJson(possibleText)
  const normalized = normalizeCohereOutput(parsed)

  if (!normalized) {
    throw new Error('Could not parse JSON from Cohere response.')
  }

  return normalized
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  if (req.method === 'POST' && req.url === '/api/authenticity/analyze') {
    const body = await parseBody(req)
    if (!body) {
      json(res, 400, { error: 'Invalid JSON payload.' })
      return
    }

    const answer = typeof body.answer === 'string' ? body.answer.trim() : ''
    if (!answer) {
      json(res, 400, { error: 'Answer text is required.' })
      return
    }

    try {
      const result = await analyzeWithCohere({
        question: body.question,
        answer,
        lessonTitle: body.lessonTitle,
        courseName: body.courseName,
      })

      json(res, 200, { ok: true, provider: 'cohere', result })
      return
    } catch (error) {
      console.error('Authenticity Analysis Error:', error)
      json(res, 502, {
        ok: false,
        provider: 'cohere',
        error: error instanceof Error ? error.message : 'Unexpected Cohere error.',
      })
      return
    }
  }

  json(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`Authenticity API running on http://localhost:${PORT}`)
})
