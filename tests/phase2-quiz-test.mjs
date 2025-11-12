#!/usr/bin/env node

/**
 * Phase 2B: Practice Quiz Generation Tests
 * Tests for the quiz generation feature including question types and grading
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Test utilities
let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`)
    passed++
  } else {
    console.log(`✗ ${message}`)
    failed++
  }
}

function assertExists(value, message) {
  assert(value !== undefined && value !== null, message)
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`)
}

function assertGreaterThan(actual, min, message) {
  assert(actual > min, `${message} (expected > ${min}, got: ${actual})`)
}

console.log('🧪 Phase 2B: Practice Quiz Generation Tests\n')

// Test 1: Check if quiz generator library exists
console.log('Test 1: Quiz generator library exists')
try {
  const quizGenPath = join(process.cwd(), 'lib', 'quiz-generator.ts')
  const exists = existsSync(quizGenPath)
  assert(exists, 'Quiz generator library file exists')
  
  if (exists) {
    const content = readFileSync(quizGenPath, 'utf-8')
    assert(content.includes('export function createQuizFromNotes'), 'Contains createQuizFromNotes function')
    assert(content.includes('export function gradeQuiz'), 'Contains gradeQuiz function')
    assert(content.includes('export function extractFactsFromNotes'), 'Contains extractFactsFromNotes function')
  }
} catch (error) {
  console.log(`✗ Failed: ${error.message}`)
  failed += 3
}

// Test 2: Check if generate-quiz tool exists
console.log('\nTest 2: Generate quiz tool exists')
try {
  const toolPath = join(process.cwd(), 'ai', 'tools', 'generate-quiz.ts')
  const exists = existsSync(toolPath)
  assert(exists, 'Generate quiz tool file exists')
  
  if (exists) {
    const content = readFileSync(toolPath, 'utf-8')
    assert(content.includes('export const generateQuiz'), 'Contains generateQuiz export')
    assert(content.includes('action: z.enum'), 'Has action parameter with enum')
    assert(content.includes('create'), 'Supports create action')
    assert(content.includes('grade'), 'Supports grade action')
    assert(content.includes('list'), 'Supports list action')
  }
} catch (error) {
  console.log(`✗ Failed: ${error.message}`)
  failed += 5
}

// Test 3: Check data schema integration
console.log('\nTest 3: Data schema integration')
try {
  const dataPartsPath = join(process.cwd(), 'ai', 'messages', 'data-parts.ts')
  const content = readFileSync(dataPartsPath, 'utf-8')
  assert(content.includes("'uni-quiz'"), 'Data parts includes uni-quiz schema')
  assert(content.includes('action: z.enum'), 'Quiz schema has action field')
  assert(content.includes('score: z.number'), 'Quiz schema has score field')
  assert(content.includes('questions: z.array'), 'Quiz schema has questions field')
} catch (error) {
  console.log(`✗ Failed: ${error.message}`)
  failed += 4
}

// Test 4: Check tool registration
console.log('\nTest 4: Tool registration')
try {
  const indexPath = join(process.cwd(), 'ai', 'tools', 'index.ts')
  const content = readFileSync(indexPath, 'utf-8')
  assert(content.includes("import { generateQuiz }"), 'Tool is imported')
  assert(content.includes('generateQuiz: generateQuiz({ writer })'), 'Tool is registered')
} catch (error) {
  console.log(`✗ Failed: ${error.message}`)
  failed += 2
}

// Test 5: Test quiz generation logic with biology notes
console.log('\nTest 5: Quiz generation from biology notes')
try {
  // Import quiz generator functions using dynamic import
  const { createQuizFromNotes, extractFactsFromNotes } = await import('../lib/quiz-generator.ts')
  
  // Read biology notes
  const notesPath = join(process.cwd(), 'notes', 'biology-cells.md')
  const notesContent = readFileSync(notesPath, 'utf-8')
  
  // Extract facts
  const facts = extractFactsFromNotes(notesContent)
  assertGreaterThan(facts.length, 0, `Extracted ${facts.length} facts from biology notes`)
  assertGreaterThan(facts.length, 10, 'Extracted at least 10 facts')
  
  // Create quiz
  const quiz = createQuizFromNotes(notesContent, 'Biology Cells Test', 'notes/biology-cells.md', {
    totalQuestions: 12,
    questionTypes: ['multiple-choice', 'true-false', 'fill-blank'],
    difficulty: 'mixed'
  })
  
  assertExists(quiz, 'Quiz object created')
  assertExists(quiz.id, 'Quiz has ID')
  assertEqual(quiz.title, 'Biology Cells Test', 'Quiz has correct title')
  assertGreaterThan(quiz.questions.length, 0, `Quiz has ${quiz.questions.length} questions`)
  assertEqual(quiz.questions.length, 12, 'Quiz has requested number of questions')
  
  // Check question types
  const mcQuestions = quiz.questions.filter(q => q.type === 'multiple-choice')
  const tfQuestions = quiz.questions.filter(q => q.type === 'true-false')
  const fbQuestions = quiz.questions.filter(q => q.type === 'fill-blank')
  
  assertGreaterThan(mcQuestions.length, 0, `Has ${mcQuestions.length} multiple choice questions`)
  assertGreaterThan(tfQuestions.length, 0, `Has ${tfQuestions.length} true/false questions`)
  assertGreaterThan(fbQuestions.length, 0, `Has ${fbQuestions.length} fill-in-blank questions`)
  
  // Validate multiple choice question structure
  if (mcQuestions.length > 0) {
    const mcq = mcQuestions[0]
    assertExists(mcq.question, 'MC question has question text')
    assertExists(mcq.options, 'MC question has options')
    assertEqual(mcq.options.length, 4, 'MC question has 4 options')
    assertExists(mcq.correctAnswer, 'MC question has correct answer index')
    assert(mcq.correctAnswer >= 0 && mcq.correctAnswer < 4, 'MC correct answer is valid index')
  }
  
  // Validate true/false question structure
  if (tfQuestions.length > 0) {
    const tfq = tfQuestions[0]
    assertExists(tfq.statement, 'T/F question has statement')
    assertExists(tfq.correctAnswer, 'T/F question has correct answer')
    assert(typeof tfq.correctAnswer === 'boolean', 'T/F correct answer is boolean')
  }
  
  // Validate fill-in-blank question structure
  if (fbQuestions.length > 0) {
    const fbq = fbQuestions[0]
    assertExists(fbq.question, 'Fill-blank question has question text')
    assertExists(fbq.correctAnswer, 'Fill-blank question has correct answer')
    assert(fbq.question.includes('______'), 'Fill-blank question has blank placeholder')
  }
  
} catch (error) {
  console.log(`✗ Failed: ${error.message}`)
  console.log(error.stack)
  failed += 15
}

// Test 6: Test quiz grading
console.log('\nTest 6: Quiz grading functionality')
try {
  const { createQuizFromNotes, gradeQuiz } = await import('../lib/quiz-generator.ts')
  
  // Create a simple quiz
  const notesPath = join(process.cwd(), 'notes', 'biology-cells.md')
  const notesContent = readFileSync(notesPath, 'utf-8')
  
  const quiz = createQuizFromNotes(notesContent, 'Test Quiz', 'notes/biology-cells.md', {
    totalQuestions: 6,
    questionTypes: ['multiple-choice', 'true-false', 'fill-blank'],
    difficulty: 'mixed'
  })
  
  // Create mock answers (all correct)
  const correctAnswers = {}
  quiz.questions.forEach(q => {
    if (q.type === 'multiple-choice') {
      correctAnswers[q.id] = q.correctAnswer
    } else if (q.type === 'true-false') {
      correctAnswers[q.id] = q.correctAnswer
    } else if (q.type === 'fill-blank') {
      correctAnswers[q.id] = q.correctAnswer
    }
  })
  
  // Grade with all correct answers
  const perfectResult = gradeQuiz(quiz, correctAnswers)
  assertExists(perfectResult, 'Grading result returned')
  assertEqual(perfectResult.score, 100, 'Perfect score is 100')
  assertEqual(perfectResult.correctCount, quiz.questions.length, 'All answers marked correct')
  assertEqual(perfectResult.totalQuestions, quiz.questions.length, 'Total questions matches')
  assertExists(perfectResult.feedback, 'Feedback provided')
  assertEqual(perfectResult.feedback.length, quiz.questions.length, 'Feedback for all questions')
  
  // Grade with all wrong answers
  const wrongAnswers = {}
  quiz.questions.forEach(q => {
    if (q.type === 'multiple-choice') {
      wrongAnswers[q.id] = (q.correctAnswer + 1) % 4
    } else if (q.type === 'true-false') {
      wrongAnswers[q.id] = !q.correctAnswer
    } else if (q.type === 'fill-blank') {
      wrongAnswers[q.id] = 'wrong answer'
    }
  })
  
  const failResult = gradeQuiz(quiz, wrongAnswers)
  assertEqual(failResult.score, 0, 'Zero correct gives 0 score')
  assertEqual(failResult.correctCount, 0, 'No answers marked correct')
  
  // Grade with partial correct answers
  const partialAnswers = {}
  quiz.questions.forEach((q, idx) => {
    if (idx < quiz.questions.length / 2) {
      // First half correct
      if (q.type === 'multiple-choice') {
        partialAnswers[q.id] = q.correctAnswer
      } else if (q.type === 'true-false') {
        partialAnswers[q.id] = q.correctAnswer
      } else if (q.type === 'fill-blank') {
        partialAnswers[q.id] = q.correctAnswer
      }
    } else {
      // Second half wrong
      if (q.type === 'multiple-choice') {
        partialAnswers[q.id] = (q.correctAnswer + 1) % 4
      } else if (q.type === 'true-false') {
        partialAnswers[q.id] = !q.correctAnswer
      } else if (q.type === 'fill-blank') {
        partialAnswers[q.id] = 'wrong'
      }
    }
  })
  
  const partialResult = gradeQuiz(quiz, partialAnswers)
  assertGreaterThan(partialResult.score, 0, 'Partial score is greater than 0')
  assertGreaterThan(100, partialResult.score, 'Partial score is less than 100')
  assertEqual(partialResult.correctCount, Math.floor(quiz.questions.length / 2), 'Half of answers correct')
  
} catch (error) {
  console.log(`✗ Failed: ${error.message}`)
  console.log(error.stack)
  failed += 12
}

// Test 7: Test difficulty levels
console.log('\nTest 7: Question difficulty levels')
try {
  const { createQuizFromNotes } = await import('../lib/quiz-generator.ts')
  
  const notesPath = join(process.cwd(), 'notes', 'biology-cells.md')
  const notesContent = readFileSync(notesPath, 'utf-8')
  
  // Create quizzes with different difficulty levels
  const easyQuiz = createQuizFromNotes(notesContent, 'Easy Quiz', 'notes/biology-cells.md', {
    totalQuestions: 5,
    difficulty: 'easy'
  })
  
  const hardQuiz = createQuizFromNotes(notesContent, 'Hard Quiz', 'notes/biology-cells.md', {
    totalQuestions: 5,
    difficulty: 'hard'
  })
  
  const mixedQuiz = createQuizFromNotes(notesContent, 'Mixed Quiz', 'notes/biology-cells.md', {
    totalQuestions: 10,
    difficulty: 'mixed'
  })
  
  assertExists(easyQuiz, 'Easy quiz created')
  assertExists(hardQuiz, 'Hard quiz created')
  assertExists(mixedQuiz, 'Mixed difficulty quiz created')
  
  // Easy quiz should have easier questions (shorter definitions typically)
  assertGreaterThan(easyQuiz.questions.length, 0, `Easy quiz has ${easyQuiz.questions.length} questions`)
  
  // Mixed quiz should have various difficulties
  assertGreaterThan(mixedQuiz.questions.length, 0, `Mixed quiz has ${mixedQuiz.questions.length} questions`)
  
} catch (error) {
  console.log(`✗ Failed: ${error.message}`)
  console.log(error.stack)
  failed += 5
}

// Test 8: Test question type filtering
console.log('\nTest 8: Question type filtering')
try {
  const { createQuizFromNotes } = await import('../lib/quiz-generator.ts')
  
  const notesPath = join(process.cwd(), 'notes', 'biology-cells.md')
  const notesContent = readFileSync(notesPath, 'utf-8')
  
  // Create quiz with only multiple choice
  const mcOnlyQuiz = createQuizFromNotes(notesContent, 'MC Only', 'notes/biology-cells.md', {
    totalQuestions: 5,
    questionTypes: ['multiple-choice']
  })
  
  assert(mcOnlyQuiz.questions.every(q => q.type === 'multiple-choice'), 'All questions are multiple choice')
  
  // Create quiz with only true/false
  const tfOnlyQuiz = createQuizFromNotes(notesContent, 'T/F Only', 'notes/biology-cells.md', {
    totalQuestions: 5,
    questionTypes: ['true-false']
  })
  
  assert(tfOnlyQuiz.questions.every(q => q.type === 'true-false'), 'All questions are true/false')
  
  // Create quiz with only fill-in-blank
  const fbOnlyQuiz = createQuizFromNotes(notesContent, 'Fill-Blank Only', 'notes/biology-cells.md', {
    totalQuestions: 5,
    questionTypes: ['fill-blank']
  })
  
  assert(fbOnlyQuiz.questions.every(q => q.type === 'fill-blank'), 'All questions are fill-in-blank')
  
} catch (error) {
  console.log(`✗ Failed: ${error.message}`)
  console.log(error.stack)
  failed += 3
}

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Test Summary: ${passed} passed, ${failed} failed`)
console.log('='.repeat(50))

if (failed === 0) {
  console.log('✓ All Phase 2B quiz generation tests passed!')
  process.exit(0)
} else {
  console.log(`✗ ${failed} test(s) failed`)
  process.exit(1)
}
