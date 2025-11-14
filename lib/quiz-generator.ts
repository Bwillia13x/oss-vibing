/**
 * Quiz Generator Library
 * Generates practice quizzes from notes and study materials
 */

export interface MultipleChoiceQuestion {
  type: 'multiple-choice'
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

export interface TrueFalseQuestion {
  type: 'true-false'
  id: string
  statement: string
  correctAnswer: boolean
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

export interface FillInBlankQuestion {
  type: 'fill-blank'
  id: string
  question: string
  correctAnswer: string
  acceptableAnswers?: string[]
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

export type QuizQuestion = MultipleChoiceQuestion | TrueFalseQuestion | FillInBlankQuestion

export interface Quiz {
  id: string
  title: string
  source: string
  questions: QuizQuestion[]
  createdAt: string
  totalPoints: number
}

export interface QuizAttempt {
  quizId: string
  attemptId: string
  startedAt: string
  completedAt?: string
  answers: Record<string, any>
  score?: number
  correctCount?: number
  totalQuestions?: number
}

/**
 * Parse notes content and extract facts for question generation
 */
export function extractFactsFromNotes(content: string): Array<{
  fact: string
  concept: string
  type: 'definition' | 'process' | 'comparison' | 'fact'
}> {
  const facts: Array<{ fact: string; concept: string; type: 'definition' | 'process' | 'comparison' | 'fact' }> = []
  
  // Match definition patterns: "Term: Definition"
  const definitionPattern = /(?:^|\n)\*?\*?([^:\n]+)\*?\*?:\s*([^\n]+(?:\n(?![\n#\*\-])[^\n]+)*)/g
  let match
  while ((match = definitionPattern.exec(content)) !== null) {
    const concept = match[1].trim()
    const definition = match[2].trim()
    if (concept && definition && concept.length < 100) {
      facts.push({ 
        concept, 
        fact: definition,
        type: 'definition'
      })
    }
  }
  
  // Match process descriptions (often start with verbs or contain steps)
  const processPattern = /(?:^|\n)(?:The process|This (?:process|stage|step)|During)([^\n]+(?:\n(?![\n#\*\-])[^\n]+)*)/gi
  while ((match = processPattern.exec(content)) !== null) {
    const fact = match[0].trim()
    if (fact.length > 20 && fact.length < 300) {
      facts.push({
        concept: fact.substring(0, 50) + '...',
        fact,
        type: 'process'
      })
    }
  }
  
  return facts
}

/**
 * Generate multiple choice questions from facts
 */
export function generateMultipleChoiceQuestions(
  facts: Array<{ fact: string; concept: string }>,
  count: number
): MultipleChoiceQuestion[] {
  const questions: MultipleChoiceQuestion[] = []
  const usedFacts = new Set<string>()
  
  for (let i = 0; i < Math.min(count, facts.length); i++) {
    const factIndex = i % facts.length
    const fact = facts[factIndex]
    
    if (usedFacts.has(fact.concept)) continue
    usedFacts.add(fact.concept)
    
    // Create question based on the fact type
    const question = `What is ${fact.concept}?`
    const correctAnswer = fact.fact.substring(0, 150)
    
    // Generate plausible distractors
    const distractors = generateDistractors(fact.fact, facts, 3)
    
    // Randomize option order
    const options = [correctAnswer, ...distractors]
    shuffleArray(options)
    const finalCorrectIndex = options.indexOf(correctAnswer)
    
    questions.push({
      type: 'multiple-choice',
      id: `mc-${Date.now()}-${i}`,
      question,
      options,
      correctAnswer: finalCorrectIndex,
      explanation: `${fact.concept} is defined as: ${fact.fact}`,
      difficulty: fact.fact.length > 100 ? 'hard' : fact.fact.length > 50 ? 'medium' : 'easy',
      tags: [fact.concept]
    })
  }
  
  return questions
}

/**
 * Generate true/false questions from facts
 */
export function generateTrueFalseQuestions(
  facts: Array<{ fact: string; concept: string }>,
  count: number
): TrueFalseQuestion[] {
  const questions: TrueFalseQuestion[] = []
  const usedFacts = new Set<string>()
  
  for (let i = 0; i < Math.min(count, facts.length); i++) {
    const fact = facts[i % facts.length]
    
    if (usedFacts.has(fact.concept)) continue
    usedFacts.add(fact.concept)
    
    // 50% true statements, 50% false statements
    const isTrue = i % 2 === 0
    
    let statement: string
    if (isTrue) {
      statement = `${fact.concept} is ${fact.fact.split('.')[0].toLowerCase()}`
    } else {
      // Create a false statement by negating or modifying the fact
      statement = createFalseStatement(fact)
    }
    
    questions.push({
      type: 'true-false',
      id: `tf-${Date.now()}-${i}`,
      statement,
      correctAnswer: isTrue,
      explanation: isTrue ? `Correct. ${fact.fact}` : `False. ${fact.fact}`,
      difficulty: 'easy',
      tags: [fact.concept]
    })
  }
  
  return questions
}

/**
 * Generate fill-in-the-blank questions from facts
 */
export function generateFillInBlankQuestions(
  facts: Array<{ fact: string; concept: string }>,
  count: number
): FillInBlankQuestion[] {
  const questions: FillInBlankQuestion[] = []
  const usedFacts = new Set<string>()
  
  for (let i = 0; i < Math.min(count, facts.length); i++) {
    const fact = facts[i % facts.length]
    
    if (usedFacts.has(fact.concept)) continue
    usedFacts.add(fact.concept)
    
    // Create fill-in-blank by removing the concept from the definition
    const question = fact.fact.replace(new RegExp(fact.concept, 'gi'), '______')
    
    // If no replacement occurred, use a different pattern
    const finalQuestion = question === fact.fact 
      ? `______ is defined as: ${fact.fact}`
      : question
    
    questions.push({
      type: 'fill-blank',
      id: `fb-${Date.now()}-${i}`,
      question: finalQuestion,
      correctAnswer: fact.concept,
      acceptableAnswers: [
        fact.concept,
        fact.concept.toLowerCase(),
        fact.concept.toUpperCase()
      ],
      explanation: `The answer is "${fact.concept}". ${fact.fact}`,
      difficulty: 'medium',
      tags: [fact.concept]
    })
  }
  
  return questions
}

/**
 * Generate distractors (incorrect options) for multiple choice questions
 */
function generateDistractors(correctAnswer: string, allFacts: Array<{ fact: string; concept: string }>, count: number): string[] {
  const distractors: string[] = []
  
  // Use other facts as distractors
  const otherFacts = allFacts.filter(f => f.fact !== correctAnswer).slice(0, count)
  
  for (const fact of otherFacts) {
    distractors.push(fact.fact.substring(0, 150))
  }
  
  // If not enough distractors, create generic ones
  while (distractors.length < count) {
    distractors.push(`A different biological process not described in the notes`)
  }
  
  return distractors.slice(0, count)
}

/**
 * Create a false statement by modifying a fact
 */
function createFalseStatement(fact: { fact: string; concept: string }): string {
  // Simple approach: add "not" or change key terms
  const sentences = fact.fact.split('.')
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim()
    if (firstSentence.includes(' is ')) {
      return `${fact.concept} is not ${firstSentence.split(' is ')[1]}`
    } else if (firstSentence.includes(' are ')) {
      return `${fact.concept} are not ${firstSentence.split(' are ')[1]}`
    }
  }
  return `${fact.concept} is not involved in this process`
}

/**
 * Shuffle array in place
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Create a complete quiz from notes
 */
export function createQuizFromNotes(
  content: string,
  title: string,
  source: string,
  options: {
    totalQuestions?: number
    questionTypes?: Array<'multiple-choice' | 'true-false' | 'fill-blank'>
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  } = {}
): Quiz {
  const {
    totalQuestions = 10,
    questionTypes = ['multiple-choice', 'true-false', 'fill-blank'],
    difficulty = 'mixed'
  } = options
  
  const facts = extractFactsFromNotes(content)
  const questions: QuizQuestion[] = []
  
  // Distribute questions across types
  const questionsPerType = Math.floor(totalQuestions / questionTypes.length)
  const remainder = totalQuestions % questionTypes.length
  
  if (questionTypes.includes('multiple-choice')) {
    const mcCount = questionsPerType + (remainder > 0 ? 1 : 0)
    questions.push(...generateMultipleChoiceQuestions(facts, mcCount))
  }
  
  if (questionTypes.includes('true-false')) {
    const tfCount = questionsPerType + (remainder > 1 ? 1 : 0)
    questions.push(...generateTrueFalseQuestions(facts, tfCount))
  }
  
  if (questionTypes.includes('fill-blank')) {
    const fbCount = questionsPerType
    questions.push(...generateFillInBlankQuestions(facts, fbCount))
  }
  
  // Filter by difficulty if specified
  const filteredQuestions = difficulty === 'mixed' 
    ? questions 
    : questions.filter(q => q.difficulty === difficulty)
  
  return {
    id: `quiz-${Date.now()}`,
    title,
    source,
    questions: filteredQuestions.slice(0, totalQuestions),
    createdAt: new Date().toISOString(),
    totalPoints: filteredQuestions.length
  }
}

/**
 * Grade a quiz attempt
 */
export function gradeQuiz(quiz: Quiz, answers: Record<string, any>): {
  score: number
  correctCount: number
  totalQuestions: number
  feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>
} {
  let correctCount = 0
  const feedback: Array<{ questionId: string; correct: boolean; explanation?: string }> = []
  
  for (const question of quiz.questions) {
    const userAnswer = answers[question.id]
    let isCorrect = false
    
    switch (question.type) {
      case 'multiple-choice':
        isCorrect = userAnswer === question.correctAnswer
        break
      case 'true-false':
        isCorrect = userAnswer === question.correctAnswer
        break
      case 'fill-blank':
        const normalizedAnswer = String(userAnswer || '').trim().toLowerCase()
        isCorrect = question.acceptableAnswers?.some(
          ans => ans.toLowerCase() === normalizedAnswer
        ) || normalizedAnswer === question.correctAnswer.toLowerCase()
        break
    }
    
    if (isCorrect) correctCount++
    
    feedback.push({
      questionId: question.id,
      correct: isCorrect,
      explanation: question.explanation
    })
  }
  
  const score = Math.round((correctCount / quiz.questions.length) * 100)
  
  return {
    score,
    correctCount,
    totalQuestions: quiz.questions.length,
    feedback
  }
}
