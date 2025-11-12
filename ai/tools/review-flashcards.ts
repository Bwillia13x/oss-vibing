import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './review-flashcards.md'
import z from 'zod/v3'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { calculateNextReview, isDue, sortByDueDate, type ReviewQuality } from '../../lib/sm2-algorithm'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface FlashcardDeck {
  name: string
  source: string
  created: string
  policy: 'cloze' | 'qa' | 'term'
  cards: Array<{
    id: string
    front: string
    back: string
    type: string
    reviewData: {
      easeFactor: number
      interval: number
      repetitions: number
      nextReview: string
      lastReviewed?: string
    }
  }>
}

export const reviewFlashcards = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      deckPath: z.string().describe('Path to flashcard deck file'),
      action: z.enum(['start', 'update']).default('start').describe('Action: start new session or update after review'),
      cardId: z.string().optional().describe('Card ID for update action'),
      quality: z.number().min(0).max(5).optional().describe('Review quality (0-5): 0=blackout, 3=correct with difficulty, 5=perfect'),
    }),
    execute: async ({ deckPath, action, cardId, quality }, { toolCallId }) => {
      try {
        // Load the flashcard deck
        const fullPath = path.resolve(deckPath)
        if (!existsSync(fullPath)) {
          throw new Error(`Flashcard deck not found: ${deckPath}`)
        }
        
        const deckContent = await readFile(fullPath, 'utf-8')
        const deck: FlashcardDeck = JSON.parse(deckContent)
        
        if (action === 'start') {
          // Find cards due for review
          const dueCards = deck.cards.filter(card => {
            const reviewData = {
              easeFactor: card.reviewData.easeFactor,
              interval: card.reviewData.interval,
              repetitions: card.reviewData.repetitions,
              nextReview: new Date(card.reviewData.nextReview),
              lastReviewed: card.reviewData.lastReviewed ? new Date(card.reviewData.lastReviewed) : undefined,
            }
            return isDue(reviewData)
          })
          
          // Sort by due date (most overdue first)
          const sortedCards = sortByDueDate(
            dueCards.map(card => ({
              ...card,
              reviewData: {
                easeFactor: card.reviewData.easeFactor,
                interval: card.reviewData.interval,
                repetitions: card.reviewData.repetitions,
                nextReview: new Date(card.reviewData.nextReview),
                lastReviewed: card.reviewData.lastReviewed ? new Date(card.reviewData.lastReviewed) : undefined,
              },
            }))
          )
          
          // Prepare cards for display
          const cardsForDisplay = sortedCards.slice(0, 20).map(card => ({
            front: card.front,
            back: card.back,
            type: card.type as 'cloze' | 'qa' | 'term',
          }))
          
          writer.write({
            id: toolCallId,
            type: 'data-uni-flashcards',
            data: {
              count: sortedCards.length,
              cards: cardsForDisplay,
              scheduleMeta: {
                nextReview: sortedCards[0]?.reviewData.nextReview.toISOString(),
                interval: sortedCards[0]?.reviewData.interval || 1,
              },
              status: 'done',
            },
          })
          
          return `Found ${sortedCards.length} cards due for review in ${deck.name}. ${cardsForDisplay.length} cards ready to review. Rate each card 0-5 based on recall difficulty.`
        } else if (action === 'update') {
          // Update a card's review data based on quality rating
          if (!cardId || quality === undefined) {
            throw new Error('Card ID and quality rating required for update action')
          }
          
          const cardIndex = deck.cards.findIndex(c => c.id === cardId)
          if (cardIndex === -1) {
            throw new Error(`Card not found: ${cardId}`)
          }
          
          const card = deck.cards[cardIndex]
          const currentReviewData = {
            ...card.reviewData,
            nextReview: new Date(card.reviewData.nextReview),
            lastReviewed: card.reviewData.lastReviewed ? new Date(card.reviewData.lastReviewed) : undefined,
          }
          
          // Calculate next review using SM-2 algorithm
          const updatedReviewData = calculateNextReview(quality as ReviewQuality, currentReviewData)
          
          // Update the card
          deck.cards[cardIndex].reviewData = {
            easeFactor: updatedReviewData.easeFactor,
            interval: updatedReviewData.interval,
            repetitions: updatedReviewData.repetitions,
            nextReview: updatedReviewData.nextReview.toISOString(),
            lastReviewed: updatedReviewData.lastReviewed?.toISOString(),
          }
          
          // Save updated deck
          await writeFile(fullPath, JSON.stringify(deck, null, 2), 'utf-8')
          
          writer.write({
            id: toolCallId,
            type: 'data-uni-flashcards',
            data: {
              count: 1,
              cards: [{
                front: card.front,
                back: card.back,
                type: card.type as 'cloze' | 'qa' | 'term',
              }],
              scheduleMeta: {
                nextReview: updatedReviewData.nextReview.toISOString(),
                interval: updatedReviewData.interval,
              },
              status: 'done',
            },
          })
          
          const qualityText = ['blackout', 'incorrect', 'incorrect but familiar', 
                               'correct with difficulty', 'correct with hesitation', 'perfect'][quality] || 'unknown'
          
          return `Card updated! Quality: ${qualityText} (${quality}/5). Next review in ${updatedReviewData.interval} days. Ease factor: ${updatedReviewData.easeFactor.toFixed(2)}, Repetitions: ${updatedReviewData.repetitions}`
        }
        
        throw new Error(`Invalid action: ${action}`)
      } catch (error) {
        writer.write({
          id: toolCallId,
          type: 'data-uni-flashcards',
          data: {
            count: 0,
            cards: [],
            status: 'error',
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        })
        
        throw error
      }
    },
  })
