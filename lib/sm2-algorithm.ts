/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo 2 algorithm for optimal learning intervals
 * 
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface FlashcardReviewData {
  easeFactor: number // E-Factor (quality of recall), starts at 2.5
  interval: number // Days until next review
  repetitions: number // Number of consecutive correct answers
  nextReview: Date // When the card is due for review
  lastReviewed?: Date // When the card was last reviewed
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Calculate next review schedule based on SM-2 algorithm
 * 
 * @param quality - Response quality (0-5):
 *   0: Complete blackout
 *   1: Incorrect, but recognized
 *   2: Incorrect, but familiar
 *   3: Correct with serious difficulty
 *   4: Correct with hesitation
 *   5: Perfect response
 * @param current - Current review data
 * @returns Updated review data
 */
export function calculateNextReview(
  quality: ReviewQuality,
  current: FlashcardReviewData
): FlashcardReviewData {
  let { easeFactor, interval, repetitions } = current
  
  // Update ease factor based on quality
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )
  
  // If quality is less than 3, reset repetitions
  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    repetitions += 1
    
    // Calculate interval based on repetition number
    if (repetitions === 1) {
      interval = 1 // 1 day
    } else if (repetitions === 2) {
      interval = 6 // 6 days
    } else {
      // I(n) = I(n-1) * EF
      interval = Math.round(interval * easeFactor)
    }
  }
  
  // Calculate next review date
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)
  
  return {
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReviewed: new Date(),
  }
}

/**
 * Initialize review data for a new flashcard
 */
export function initializeReviewData(): FlashcardReviewData {
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + 1) // Review tomorrow
  
  return {
    easeFactor: 2.5, // Default ease factor
    interval: 1, // Start with 1 day
    repetitions: 0,
    nextReview,
  }
}

/**
 * Check if a card is due for review
 */
export function isDue(reviewData: FlashcardReviewData): boolean {
  return new Date() >= reviewData.nextReview
}

/**
 * Get cards that are due for review
 */
export function getDueCards<T extends { reviewData: FlashcardReviewData }>(
  cards: T[]
): T[] {
  return cards.filter(card => isDue(card.reviewData))
}

/**
 * Sort cards by due date (most overdue first)
 */
export function sortByDueDate<T extends { reviewData: FlashcardReviewData }>(
  cards: T[]
): T[] {
  return [...cards].sort((a, b) => 
    a.reviewData.nextReview.getTime() - b.reviewData.nextReview.getTime()
  )
}
