'use client'

/**
 * Mobile-optimized quiz interface for Phase 3.3.1
 * Provides a touch-friendly quiz experience with mobile-first design
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  category?: string
}

interface QuizInterfaceProps {
  questions: QuizQuestion[]
  onComplete?: (results: QuizResults) => void
  timeLimit?: number // in seconds
}

interface QuizResults {
  total: number
  correct: number
  incorrect: number
  score: number
  duration: number
  answers: Record<string, { selected: number; correct: boolean }>
}

export function MobileQuizInterface({ questions, onComplete, timeLimit }: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, { selected: number; correct: boolean }>>({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [startTime] = useState(Date.now())
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isAnswered = currentQuestion && answers[currentQuestion.id] !== undefined

  // Timer countdown
  useEffect(() => {
    if (!timeLimit || !timeRemaining) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev && prev <= 1) {
          handleComplete()
          return 0
        }
        return prev ? prev - 1 : 0
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLimit, timeRemaining])

  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered) return // Prevent changing answer
    
    setSelectedAnswer(optionIndex)
    const isCorrect = optionIndex === currentQuestion.correctAnswer
    setAnswers({
      ...answers,
      [currentQuestion.id]: { selected: optionIndex, correct: isCorrect },
    })
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    const correct = Object.values(answers).filter((a) => a.correct).length
    const total = questions.length
    const score = Math.round((correct / total) * 100)
    
    const results: QuizResults = {
      total,
      correct,
      incorrect: total - correct,
      score,
      duration: Date.now() - startTime,
      answers,
    }
    onComplete?.(results)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentQuestion) {
    const correct = Object.values(answers).filter((a) => a.correct).length
    const score = Math.round((correct / questions.length) * 100)
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-6 max-w-md">
          <Award className="h-16 w-16 mx-auto text-primary" />
          <h2 className="text-3xl font-bold">Quiz Complete!</h2>
          
          <div className="space-y-4">
            <div className="text-6xl font-bold text-primary">{score}%</div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">{correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-red-600">
                  {questions.length - correct}
                </div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </Card>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Completed in {formatTime(Math.floor((Date.now() - startTime) / 1000))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const answerState = answers[currentQuestion.id]
  const isCorrect = answerState?.correct

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>
            {timeLimit && timeRemaining && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className={`text-sm font-mono ${timeRemaining < 60 ? 'text-red-600' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question and Options */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Question */}
        <Card className="p-6">
          {currentQuestion.category && (
            <Badge variant="outline" className="mb-3">
              {currentQuestion.category}
            </Badge>
          )}
          <h3 className="text-lg font-medium leading-relaxed">
            {currentQuestion.question}
          </h3>
        </Card>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index || answerState?.selected === index
            const isCorrectOption = index === currentQuestion.correctAnswer
            const showCorrect = isAnswered && isCorrectOption
            const showIncorrect = isAnswered && isSelected && !isCorrect

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  touch-manipulation min-h-[64px]
                  ${isSelected ? 'border-primary' : 'border-border'}
                  ${showCorrect ? 'bg-green-50 dark:bg-green-950/20 border-green-600' : ''}
                  ${showIncorrect ? 'bg-red-50 dark:bg-red-950/20 border-red-600' : ''}
                  ${!isAnswered ? 'hover:border-primary hover:bg-accent active:scale-[0.98]' : ''}
                  ${isAnswered ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold
                      ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}
                      ${showCorrect ? 'bg-green-600 border-green-600 text-white' : ''}
                      ${showIncorrect ? 'bg-red-600 border-red-600 text-white' : ''}
                    `}
                  >
                    {showCorrect ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : showIncorrect ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </div>
                  <span className="text-base leading-relaxed flex-1">{option}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {showExplanation && currentQuestion.explanation && (
          <Card className={`p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-2">
                <p className="font-semibold">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Next Button */}
      {isAnswered && (
        <div className="sticky bottom-0 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full touch-manipulation min-h-[56px]"
          >
            {currentIndex < questions.length - 1 ? (
              <>
                Next Question
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                View Results
                <Award className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
