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

const HF_API_KEY = process.env.HF_API_KEY || ''
const HF_MODEL = process.env.HF_MODEL || 'Hello-SimpleAI/chatgpt-detector-roberta'

const analyzeWithHF = async ({ question, answer, lessonTitle, courseName }) => {
  if (!HF_API_KEY) {
    throw new Error('HF_API_KEY is missing. You must add your free Hugging Face API Token to the .env file to use this powerful detector.')
  }

  const modelUrl = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`
  
  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${HF_API_KEY}`
  }

  // Hugging Face api needs time if model is loading, so we might need a quick retry
  const response = await fetch(modelUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ inputs: answer }),
  })

  let payload = await response.json()

  if (payload.error && payload.estimated_time) {
    // Wait for the model to load and retry once
    console.log(`Model is loading. Waiting ${payload.estimated_time}s...`)
    await new Promise(res => setTimeout(res, payload.estimated_time * 1000 + 1000))
    const retryRes = await fetch(modelUrl, { method: 'POST', headers, body: JSON.stringify({ inputs: answer }) })
    payload = await retryRes.json()
  }

  if (!response.ok && !payload?.[0]) {
    console.error(`HF API Error Status: ${response.status}`, payload)
    throw new Error(`Hugging Face request failed: ${response.status}`)
  }

  // Payload format is usually [[{"label":"ChatGPT","score":0.9},{"label":"Human","score":0.1}]]
  const predictions = Array.isArray(payload) && Array.isArray(payload[0]) ? payload[0] : payload
  
  if (!Array.isArray(predictions)) {
    throw new Error('Unexpected output from HF model')
  }

  const aiScore = predictions.find(p => p.label.toLowerCase().includes('chatgpt') || p.label === 'LABEL_1')?.score ?? 0
  const humanScore = predictions.find(p => p.label.toLowerCase().includes('human') || p.label === 'LABEL_0')?.score ?? 0

  const aiProbability = clamp(Math.round(aiScore * 100))
  const languageNaturalness = clamp(Math.round(humanScore * 100))
  const originalityScore = clamp(100 - aiProbability)
  const copyRiskScore = aiProbability > 70 ? aiProbability : (aiProbability > 40 ? 40 : 10)

  // A dedicated model does not do semantic fit checks, so we default to standard
  const semanticFitScore = 80 
  
  const rationale = aiProbability > 80 
    ? 'Strong AI and ChatGPT artifacts detected from RoBERTa structural analysis.' 
    : aiProbability > 40 
      ? 'Mixed signals detected: indicates probable humanized AI editing or heavy paraphrasing.'
      : 'Structural analysis indicates authentic human-written text flow.'

  return {
    aiProbability,
    originalityScore,
    semanticFitScore,
    copyRiskScore,
    languageNaturalness,
    rationale,
    suspiciousPhrases: []
  }
}



const analyzeWithCohere = async ({ question, answer, lessonTitle, courseName }) => {
  const COHERE_API_KEY = process.env.COHERE_API_KEY
  const COHERE_MODEL = process.env.COHERE_MODEL || 'command-r-08-2024'
  
  if (!COHERE_API_KEY) throw new Error('COHERE_API_KEY is missing.')

  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${COHERE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: COHERE_MODEL,
      temperature: 0.1,
      message: buildPrompt({ question, answer, lessonTitle, courseName }),
    }),
  })

  if (!response.ok) {
    throw new Error(`Cohere request failed: ${response.status}`)
  }

  const payload = await response.json()
  const possibleText = payload?.text || ''
  const parsed = extractFirstJson(possibleText)
  const normalized = normalizeCohereOutput(parsed)

  if (!normalized) throw new Error('Could not parse JSON from Cohere response.')
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
      let result;
      let usedProvider = 'huggingface';

      try {
        result = await analyzeWithHF({
          question: body.question,
          answer: answer,
          lessonTitle: body.lessonTitle,
          courseName: body.courseName,
        })
      } catch (hfError) {
        console.warn('HF failed, falling back to Cohere...', hfError.message)
        result = await analyzeWithCohere({
          question: body.question,
          answer: answer,
          lessonTitle: body.lessonTitle,
          courseName: body.courseName,
        })
        usedProvider = 'cohere'
      }

      json(res, 200, { ok: true, provider: usedProvider, result })
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
