import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './notes-to-flashcards.md'
import z from 'zod/v3'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { initializeReviewData } from '../../lib/sm2-algorithm'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface Flashcard {
  id: string
  front: string
  back: string
  type: 'cloze' | 'qa' | 'term'
  tags?: string[]
  reviewData: {
    easeFactor: number
    interval: number
    repetitions: number
    nextReview: string
    lastReviewed?: string
  }
}

/**
 * Parse notes content and extract key concepts for flashcard generation
 */
function parseNotes(content: string): Array<{ concept: string; definition: string; context?: string }> {
  const concepts: Array<{ concept: string; definition: string; context?: string }> = []
  
  // Match definition patterns: "Term: Definition" or "**Term**: Definition"
  const definitionPattern = /(?:^|\n)\*?\*?([^:\n]+)\*?\*?:\s*([^\n]+)/g
  let match
  while ((match = definitionPattern.exec(content)) !== null) {
    const concept = match[1].trim()
    const definition = match[2].trim()
    if (concept && definition && concept.length < 100) {
      concepts.push({ concept, definition })
    }
  }
  
  // Match heading + paragraph patterns for additional concepts
  const headingPattern = /(?:^|\n)#{1,3}\s+([^\n]+)\n+([^\n#]+)/g
  while ((match = headingPattern.exec(content)) !== null) {
    const concept = match[1].trim()
    const definition = match[2].trim()
    if (concept && definition && concept.length < 100 && !concepts.some(c => c.concept === concept)) {
      concepts.push({ concept, definition: definition.slice(0, 200) })
    }
  }
  
  // Match bullet points with bold terms
  const bulletPattern = /(?:^|\n)[\*\-]\s+\*?\*?([^:\*\n]+)\*?\*?:\s*([^\n]+)/g
  while ((match = bulletPattern.exec(content)) !== null) {
    const concept = match[1].trim()
    const definition = match[2].trim()
    if (concept && definition && concept.length < 100 && !concepts.some(c => c.concept === concept)) {
      concepts.push({ concept, definition })
    }
  }
  
  return concepts
}

/**
 * Generate flashcards from parsed concepts
 */
function generateFlashcardsFromConcepts(
  concepts: Array<{ concept: string; definition: string }>,
  policy: 'cloze' | 'qa' | 'term',
  maxCount: number
): Flashcard[] {
  const flashcards: Flashcard[] = []
  const reviewData = initializeReviewData()
  
  for (let i = 0; i < Math.min(concepts.length, maxCount); i++) {
    const { concept, definition } = concepts[i]
    const id = `card-${Date.now()}-${i}`
    
    let front: string
    let back: string
    
    switch (policy) {
      case 'cloze':
        // Create cloze deletion: "The [...] is the powerhouse of the cell"
        front = `${definition.substring(0, 50)}... [${concept}]`
        back = `${definition} (Term: ${concept})`
        break
      
      case 'term':
        // Term/Definition style
        front = concept
        back = definition
        break
      
      case 'qa':
      default:
        // Question/Answer style
        front = `What is ${concept}?`
        back = definition
        break
    }
    
    flashcards.push({
      id,
      front,
      back,
      type: policy,
      reviewData: {
        easeFactor: reviewData.easeFactor,
        interval: reviewData.interval,
        repetitions: reviewData.repetitions,
        nextReview: reviewData.nextReview.toISOString(),
        lastReviewed: reviewData.lastReviewed?.toISOString(),
      },
    })
  }
  
  return flashcards
}

export const notesToFlashcards = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      notePath: z.string().describe('Path to notes file'),
      policy: z.enum(['cloze', 'qa', 'term']).default('qa').describe('Type of flashcards to generate'),
      count: z.number().optional().describe('Maximum number of cards to generate'),
    }),
    execute: async ({ notePath, policy, count }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-flashcards',
        data: {
          count: 0,
          cards: [],
          scheduleMeta: undefined,
          status: 'generating',
        },
      })

      try {
        // Read the notes file
        const fullPath = path.resolve(notePath)
        if (!existsSync(fullPath)) {
          throw new Error(`Notes file not found: ${notePath}`)
        }
        
        const content = await readFile(fullPath, 'utf-8')
        
        // Parse notes and extract concepts
        const concepts = parseNotes(content)
        
        if (concepts.length === 0) {
          // Fallback to simple extraction if no structured content found
          writer.write({
            id: toolCallId,
            type: 'data-uni-flashcards',
            data: {
              count: 0,
              cards: [],
              scheduleMeta: {
                nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                interval: 1,
              },
              status: 'done',
            },
          })
          return `No clear concepts found in ${notePath}. Try using a more structured format with headings or "Term: Definition" patterns.`
        }
        
        // Generate flashcards
        const maxCards = count || 20
        const flashcards = generateFlashcardsFromConcepts(concepts, policy, maxCards)
        
        // Save flashcards to a deck file
        const deckDir = 'decks'
        if (!existsSync(deckDir)) {
          await mkdir(deckDir, { recursive: true })
        }
        
        const deckName = path.basename(notePath, path.extname(notePath))
        const deckPath = path.join(deckDir, `${deckName}-flashcards.json`)
        
        const deckData = {
          name: `${deckName} Flashcards`,
          source: notePath,
          created: new Date().toISOString(),
          policy,
          cards: flashcards,
        }
        
        await writeFile(deckPath, JSON.stringify(deckData, null, 2), 'utf-8')
        
        // Prepare cards for UI display (without full review data)
        const cardsForDisplay = flashcards.map(card => ({
          front: card.front,
          back: card.back,
          type: card.type,
        }))
        
        const nextReview = flashcards[0]?.reviewData.nextReview || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        writer.write({
          id: toolCallId,
          type: 'data-uni-flashcards',
          data: {
            count: flashcards.length,
            cards: cardsForDisplay,
            scheduleMeta: {
              nextReview,
              interval: 1,
            },
            status: 'done',
          },
        })

        return `Generated ${flashcards.length} ${policy} flashcards from ${notePath}. Saved to ${deckPath}. Next review scheduled using SM-2 algorithm. First review in 1 day.`
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
