'use client'

/**
 * Mobile-optimized flashcard review component for Phase 3.3.1
 * Implements touch gestures and mobile-first design
 */

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  RotateCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface Flashcard {
  id: string
  front: string
  back: string
  difficulty?: 'easy' | 'medium' | 'hard'
  lastReviewed?: number
  nextReview?: number
  repetitions?: number
}

interface FlashcardReviewProps {
  flashcards: Flashcard[]
  onComplete?: (results: ReviewResults) => void
}

interface ReviewResults {
  total: number
  correct: number
  incorrect: number
  skipped: number
  duration: number
}

export function MobileFlashcardReview({ flashcards, onComplete }: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<Record<string, 'correct' | 'incorrect' | 'skipped'>>({})
  const [startTime] = useState(() => Date.now())
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100

  // Handle swipe gestures
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrevious()
    }
  }

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped)
  }, [isFlipped])

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    } else {
      // Review complete
      const reviewResults: ReviewResults = {
        total: flashcards.length,
        correct: Object.values(results).filter((r) => r === 'correct').length,
        incorrect: Object.values(results).filter((r) => r === 'incorrect').length,
        skipped: Object.values(results).filter((r) => r === 'skipped').length,
        duration: Date.now() - startTime,
      }
      onComplete?.(reviewResults)
    }
  }, [currentIndex, flashcards.length, results, startTime, onComplete])

  const handleAnswer = useCallback((answer: 'correct' | 'incorrect' | 'skipped') => {
    setResults({ ...results, [currentCard.id]: answer })
    handleNext()
  }, [results, currentCard.id, handleNext])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setResults({})
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleFlip()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === '1') {
        e.preventDefault()
        handleAnswer('correct')
      } else if (e.key === '2') {
        e.preventDefault()
        handleAnswer('incorrect')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, isFlipped, handleFlip, handlePrevious, handleNext, handleAnswer])

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Review Complete!</h2>
          <div className="space-y-2">
            <p className="text-lg">
              Correct: {Object.values(results).filter((r) => r === 'correct').length} /{' '}
              {flashcards.length}
            </p>
            <p className="text-muted-foreground">
              Accuracy:{' '}
              {Math.round(
                (Object.values(results).filter((r) => r === 'correct').length /
                  flashcards.length) *
                  100
              )}
              %
            </p>
          </div>
          <Button onClick={handleRestart} size="lg">
            <RotateCw className="mr-2 h-4 w-4" />
            Review Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen p-4 bg-background">
      {/* Header */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          {currentCard.difficulty && (
            <Badge
              variant={
                currentCard.difficulty === 'easy'
                  ? 'default'
                  : currentCard.difficulty === 'medium'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {currentCard.difficulty}
            </Badge>
          )}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div
        className="flex-1 flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="w-full max-w-2xl cursor-pointer"
          onClick={handleFlip}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleFlip()
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={isFlipped ? 'Show front' : 'Show back'}
        >
          <Card className="p-8 min-h-[300px] flex items-center justify-center text-center transition-all duration-300 hover:shadow-lg touch-manipulation">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {isFlipped ? 'Back' : 'Front'}
              </p>
              <p className="text-xl md:text-2xl font-medium leading-relaxed">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
              <p className="text-sm text-muted-foreground">
                {isFlipped ? 'Tap to flip back' : 'Tap to reveal answer'}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        {/* Answer buttons (shown when flipped) */}
        {isFlipped && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleAnswer('incorrect')}
              className="touch-manipulation min-h-[56px]"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Incorrect
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => handleAnswer('correct')}
              className="touch-manipulation min-h-[56px]"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Correct
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="touch-manipulation min-h-[56px]"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>
          <Button
            variant="ghost"
            onClick={handleRestart}
            className="touch-manipulation min-h-[56px]"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1 && !isFlipped}
            className="touch-manipulation min-h-[56px]"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Keyboard hints */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Space/Enter: Flip • Arrows: Navigate • 1: Correct • 2: Incorrect</p>
        </div>
      </div>
    </div>
  )
}
