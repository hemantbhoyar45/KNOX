const BASELINE_STYLE = {
  avgWordLength: 4.8,
  avgSentenceLength: 13,
}

const AI_LIKE_PHRASES = [
  'in conclusion',
  'in essence',
  'it is important to note',
  'overall this demonstrates',
  'furthermore',
]

const ADVANCED_LEXICON = [
  'multifaceted',
  'paradigm',
  'synthesize',
  'holistic',
  'intrinsically',
  'ubiquitous',
  'consequently',
]

const sigmoid = (value) => 1 / (1 + Math.exp(-value))

const clamp = (value, min = 0, max = 100) => {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, value))
}

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalize = (value, min, max) => {
  const safeValue = toSafeNumber(value)
  const span = max - min
  if (span <= 0) {
    return 0
  }

  return Math.max(0, Math.min(1, (safeValue - min) / span))
}

const getStyleMetrics = (text) => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const sentences = text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const totalChars = words.reduce((sum, word) => sum + word.length, 0)

  return {
    words,
    wordCount: words.length,
    avgWordLength: words.length ? totalChars / words.length : 0,
    avgSentenceLength: sentences.length ? words.length / sentences.length : 0,
  }
}

const getLexicalMetrics = (text, metrics) => {
  const lowered = text.toLowerCase()

  const matchedPhrases = AI_LIKE_PHRASES.filter((phrase) => lowered.includes(phrase))
  const matchedAdvanced = ADVANCED_LEXICON.filter((word) => lowered.includes(word))

  const longUnusualWords = metrics.words.filter((word) => word.length >= 11).slice(0, 6)

  const lexicalDiversity = metrics.wordCount
    ? new Set(metrics.words).size / metrics.wordCount
    : 0

  const vocabularyJump =
    metrics.avgWordLength - BASELINE_STYLE.avgWordLength > 1.2 ||
    metrics.avgSentenceLength - BASELINE_STYLE.avgSentenceLength > 10

  return {
    matchedPhrases,
    matchedAdvanced,
    longUnusualWords,
    lexicalDiversity,
    vocabularyJump,
  }
}

const buildFeatureVector = ({
  metrics,
  lexical,
  responseSeconds,
  didPaste,
  answerChanges,
  cohereSignals,
}) => {
  return {
    bias: 1,
    copyRisk: normalize(cohereSignals.copyRiskScore, 0, 100),
    aiProbability: normalize(cohereSignals.aiProbability, 0, 100),
    naturalnessInverse: 1 - normalize(cohereSignals.languageNaturalness, 0, 100),
    originalityInverse: 1 - normalize(cohereSignals.originalityScore, 0, 100),
    semanticMismatch: 1 - normalize(cohereSignals.semanticFitScore, 0, 100),
    pasted: didPaste ? 1 : 0,
    fastLongResponse: responseSeconds < 12 && metrics.wordCount > 30 ? 1 : 0,
    phraseHits: normalize(lexical.matchedPhrases.length, 0, 5),
    advancedHits: normalize(lexical.matchedAdvanced.length, 0, 7),
    lexicalDensityJump: lexical.vocabularyJump ? 1 : 0,
    veryLongWords: normalize(lexical.longUnusualWords.length, 0, 6),
    lowEditVariance: answerChanges <= 1 ? 1 : 0,
    lowWordCount: metrics.wordCount < 14 ? 1 : 0,
  }
}

const WEIGHTS = {
  bias: -3.2,
  copyRisk: 2.2,
  aiProbability: 2.05,
  naturalnessInverse: 1.2,
  originalityInverse: 1.3,
  semanticMismatch: 0.6,
  pasted: 1.7,
  fastLongResponse: 1.05,
  phraseHits: 0.95,
  advancedHits: 0.42,
  lexicalDensityJump: 0.8,
  veryLongWords: 0.62,
  lowEditVariance: 0,
  lowWordCount: 0.2,
}

const scoreWithLogisticModel = (features) => {
  const weightedSum = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (features[key] || 0) * weight
  }, 0)

  return clamp(Math.round(sigmoid(weightedSum) * 100))
}

const getSuspicionLabel = (score) => {
  if (score >= 70) {
    return 'high-risk'
  }

  if (score >= 45) {
    return 'review'
  }

  return 'likely-genuine'
}

export const buildAuthenticityReport = ({
  answer,
  didPaste,
  responseSeconds,
  answerChanges,
  cohereSignals,
}) => {
  const safeSignals = {
    aiProbability: toSafeNumber(cohereSignals?.aiProbability, 50),
    originalityScore: toSafeNumber(cohereSignals?.originalityScore, 50),
    semanticFitScore: toSafeNumber(cohereSignals?.semanticFitScore, 50),
    copyRiskScore: toSafeNumber(cohereSignals?.copyRiskScore, 50),
    languageNaturalness: toSafeNumber(cohereSignals?.languageNaturalness, 50),
    rationale: typeof cohereSignals?.rationale === 'string' ? cohereSignals.rationale : '',
    suspiciousPhrases: Array.isArray(cohereSignals?.suspiciousPhrases)
      ? cohereSignals.suspiciousPhrases.filter((item) => typeof item === 'string')
      : [],
  }

  const metrics = getStyleMetrics(answer)
  const lexical = getLexicalMetrics(answer, metrics)

  const features = buildFeatureVector({
    metrics,
    lexical,
    responseSeconds,
    didPaste,
    answerChanges,
    cohereSignals: safeSignals,
  })

  const mlSuspicionScore = scoreWithLogisticModel(features)
  const authenticityScore = clamp(Math.round(100 - mlSuspicionScore))

  const highlightedWords = Array.from(
    new Set([
      ...lexical.matchedPhrases.flatMap((phrase) => phrase.split(/\s+/)),
      ...lexical.matchedAdvanced,
      ...lexical.longUnusualWords,
      ...safeSignals.suspiciousPhrases.flatMap((phrase) => phrase.split(/\s+/)),
    ]),
  )

  return {
    finalScore: authenticityScore,
    aiContentPercent: 100 - authenticityScore,
    suspicious: mlSuspicionScore >= 60,
    suspiciousLevel: getSuspicionLabel(mlSuspicionScore),
    responseSeconds: Math.round(toSafeNumber(responseSeconds, 0)),
    vocabularyJump: lexical.vocabularyJump,
    advancedHits: lexical.matchedAdvanced.length,
    aiPhraseHits: lexical.matchedPhrases.length,
    matchedPhrases: lexical.matchedPhrases,
    highlightedWords,
    styleMetrics: metrics,
    mlSuspicionScore,
    cohereSignals: safeSignals,
  }
}
