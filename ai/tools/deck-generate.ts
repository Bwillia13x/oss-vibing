import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './deck-generate.md'
import z from 'zod/v3'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Constants
const MAX_SOURCE_CONTENT_LENGTH = 4000; // Limit source content to fit in LLM context window

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface Slide {
  title: string
  content: string
  bullets: string[]
  notes?: string
}

interface DeckMetadata {
  title: string
  author?: string
  date: string
  description: string
  sourceDocument?: string
  created: string
  version: string
}

interface DeckData {
  title: string
  author?: string
  date: string
  description: string
  slides: Slide[]
  metadata: DeckMetadata
}

/**
 * Parse a document to extract content for deck generation
 */
async function loadSourceDocument(docPath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), docPath)
    if (existsSync(fullPath)) {
      const content = await readFile(fullPath, 'utf-8')
      return content
    }
    return ''
  } catch (error) {
    console.error('Error loading source document:', error)
    return ''
  }
}

/**
 * Generate deck content using AI model
 */
async function generateDeckContent(
  sourceContent: string,
  slideCount: number,
  theme: string
): Promise<{ slides: Slide[]; title: string; description: string }> {
  try {
    const prompt = `You are a presentation expert. Generate a ${slideCount}-slide presentation from the following content.

Theme: ${theme}

Content:
${sourceContent.slice(0, MAX_SOURCE_CONTENT_LENGTH)} ${sourceContent.length > MAX_SOURCE_CONTENT_LENGTH ? '...' : ''}

Please generate exactly ${slideCount} slides in the following JSON format:
{
  "title": "Presentation Title",
  "description": "Brief description of the presentation",
  "slides": [
    {
      "title": "Slide Title",
      "content": "Main slide content (2-3 sentences)",
      "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
      "notes": "Speaker notes for this slide"
    }
  ]
}

Guidelines:
- First slide should be a title slide
- Last slide should be a conclusion or summary
- Each slide should have 2-4 bullet points
- Keep content concise and focused
- Add helpful speaker notes
- Use academic/professional tone for ${theme} theme`

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: prompt,
      temperature: 0.7,
    })

    // Parse the generated JSON
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const deckData = JSON.parse(jsonMatch[0])
      return {
        slides: deckData.slides || [],
        title: deckData.title || 'Untitled Presentation',
        description: deckData.description || 'Generated presentation',
      }
    }

    throw new Error('Failed to parse generated deck content')
  } catch (error) {
    console.error('Error generating deck content:', error)
    // Return fallback content
    return generateFallbackDeck(slideCount, theme)
  }
}

/**
 * Generate fallback deck when AI generation fails
 */
function generateFallbackDeck(
  slideCount: number,
  theme: string
): { slides: Slide[]; title: string; description: string } {
  const slides: Slide[] = []
  
  // Title slide
  slides.push({
    title: 'Presentation Title',
    content: 'Generated from source content',
    bullets: [],
    notes: 'This is a generated presentation. Customize the content as needed.',
  })

  // Content slides
  for (let i = 1; i < slideCount - 1; i++) {
    slides.push({
      title: `Main Point ${i}`,
      content: `Key information for slide ${i}`,
      bullets: [
        `Key point ${i}.1`,
        `Key point ${i}.2`,
        `Key point ${i}.3`,
      ],
      notes: `Speaker notes for slide ${i}`,
    })
  }

  // Conclusion slide
  if (slideCount > 1) {
    slides.push({
      title: 'Conclusion',
      content: 'Summary of key points',
      bullets: ['Main takeaway 1', 'Main takeaway 2', 'Next steps'],
      notes: 'Wrap up with a strong conclusion',
    })
  }

  return {
    slides,
    title: 'Generated Presentation',
    description: `${slideCount}-slide presentation using ${theme} theme`,
  }
}

/**
 * Save deck to file system
 */
async function saveDeck(deckData: DeckData, filename: string): Promise<string> {
  try {
    const decksDir = path.join(process.cwd(), 'decks')
    
    // Ensure decks directory exists
    if (!existsSync(decksDir)) {
      await mkdir(decksDir, { recursive: true })
    }

    const filepath = path.join(decksDir, filename)
    await writeFile(filepath, JSON.stringify(deckData, null, 2), 'utf-8')
    
    console.log(`Deck saved to: ${filepath}`)
    return filepath
  } catch (error) {
    console.error('Error saving deck:', error)
    throw error
  }
}

export const deckGenerate = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      docPath: z.string().optional().describe('Path to source document'),
      outline: z.string().optional().describe('Outline text to convert'),
      slideCount: z.number().default(10).describe('Target number of slides'),
      theme: z.string().default('academic').describe('Presentation theme'),
    }),
    execute: async ({ docPath, outline, slideCount, theme }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-deck-generate',
        data: {
          slideTitles: [],
          slides: [],
          speakerNotes: [],
          status: 'generating',
        },
      })

      try {
        // Load source content
        let sourceContent = outline || ''
        if (docPath && !sourceContent) {
          sourceContent = await loadSourceDocument(docPath)
        }

        // If no source content, use a default template
        if (!sourceContent) {
          sourceContent = 'Create a presentation about the key topics and concepts.'
        }

        // Generate deck content using AI
        const { slides, title, description } = await generateDeckContent(
          sourceContent,
          slideCount,
          theme
        )

        // Stream intermediate updates
        const slideTitles = slides.map(s => s.title)
        writer.write({
          id: toolCallId,
          type: 'data-uni-deck-generate',
          data: {
            slideTitles,
            slides: slides.map((s, i) => ({
              title: s.title,
              content: s.content,
              bullets: s.bullets,
              index: i,
            })),
            speakerNotes: slides.map(s => s.notes || ''),
            status: 'generating',
          },
        })

        // Create deck data structure
        const deckData: DeckData = {
          title,
          author: 'AI Generated',
          date: new Date().toISOString().split('T')[0],
          description,
          slides,
          metadata: {
            title,
            date: new Date().toISOString().split('T')[0],
            description,
            sourceDocument: docPath,
            created: new Date().toISOString(),
            version: '1.0',
          },
        }

        // Save deck to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `deck-${timestamp}.json`
        const filepath = await saveDeck(deckData, filename)

        // Send completion update
        writer.write({
          id: toolCallId,
          type: 'data-uni-deck-generate',
          data: {
            slideTitles,
            slides: slides.map((s, i) => ({
              title: s.title,
              content: s.content,
              bullets: s.bullets,
              index: i,
            })),
            speakerNotes: slides.map(s => s.notes || ''),
            status: 'done',
          },
        })

        return `Generated presentation "${title}" with ${slides.length} slides using ${theme} theme. Saved to ${filepath}.`
      } catch (error) {
        console.error('Error generating deck:', error)
        
        writer.write({
          id: toolCallId,
          type: 'data-uni-deck-generate',
          data: {
            slideTitles: [],
            slides: [],
            speakerNotes: [],
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
