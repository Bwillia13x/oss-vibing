import { type ChatUIMessage } from '@/components/chat/types'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from 'ai'
import { DEFAULT_MODEL, Models } from '@/ai/constants'
import { NextResponse } from 'next/server'
import { getAvailableModels, getModelOptions } from '@/ai/gateway'
import { checkBotId } from 'botid/server'
import { tools } from '@/ai/tools'
import { apiRateLimiter } from '@/lib/cache'
import prompt from './prompt.md'

interface BodyData {
  messages: ChatUIMessage[]
  modelId?: string
  reasoningEffort?: 'low' | 'medium'
}

export async function POST(req: Request) {
  // Bot detection
  const checkResult = await checkBotId()
  if (checkResult.isBot) {
    return NextResponse.json({ error: `Bot detected` }, { status: 403 })
  }

  // Rate limiting - use IP address or session identifier
  const forwardedFor = req.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'

  if (!apiRateLimiter.isAllowed(ip)) {
    const remaining = apiRateLimiter.remaining(ip)
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again later.` },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'Retry-After': '60'
        }
      }
    )
  }

  const [models, { messages, modelId = DEFAULT_MODEL, reasoningEffort }] =
    await Promise.all([getAvailableModels(), req.json() as Promise<BodyData>])

  const model = models.find((model) => model.id === modelId)
  if (!model) {
    return NextResponse.json(
      { error: `Model ${modelId} not found.` },
      { status: 400 }
    )
  }

  // Mock Mode Handling
  if (modelId === Models.MockGPT4o || modelId === Models.MockClaude35Sonnet) {
    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        originalMessages: messages,
        execute: ({ writer }) => {
          const streamWriter = writer as any
          streamWriter.append({
            type: 'text-delta',
            textDelta: 'This is a mock response from the Vibe University AI. ',
          })
          setTimeout(() => {
            streamWriter.append({
              type: 'text-delta',
              textDelta: 'I am functioning in development mode without an active API connection. ',
            })
          }, 500)
          setTimeout(() => {
            streamWriter.append({
              type: 'text-delta',
              textDelta: 'You can proceed with testing the UI and other features.',
            })
            streamWriter.close()
          }, 1000)
        },
      }),
    })
  }

  // RAG Integration
  let systemContext = ''
  // Check if we should perform RAG (e.g., based on a mode flag or always)
  // For now, let's assume we do it if the user asks for it or if there's a specific header/flag
  // Or we can just append it to the system prompt if found.

  // Simple heuristic: If the message is long enough, try to find context.
  const currentMessage = messages[messages.length - 1]
  const textContent = currentMessage.parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join(' ')

  if (textContent.length > 10) {
    const { ragService } = await import('@/lib/ai/rag')
    const retrievedContext = await ragService.retrieveContext(textContent)
    if (retrievedContext) {
      systemContext = `\n\nRELEVANT CONTEXT FROM USER KNOWLEDGE BASE:\n${retrievedContext}\n\nUse the above context to answer the user's question if relevant.`
    }
  }

  const systemMessage = `${prompt}
  
  ${systemContext}`

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      originalMessages: messages,
      execute: ({ writer }) => {
        const result = streamText({
          ...getModelOptions(modelId, { reasoningEffort }),
          system: systemMessage,
          messages: convertToModelMessages(
            messages.map((message) => {
              message.parts = message.parts.map((part) => {
                if (part.type === 'data-report-errors') {
                  return {
                    type: 'text',
                    text:
                      `There are errors in the generated code. This is the summary of the errors we have:\n` +
                      `\`\`\`${part.data.summary}\`\`\`\n` +
                      (part.data.paths?.length
                        ? `The following files may contain errors:\n` +
                        `\`\`\`${part.data.paths?.join('\n')}\`\`\`\n`
                        : '') +
                      `Fix the errors reported.`,
                  }
                }
                return part
              })
              return message
            })
          ),
          stopWhen: stepCountIs(20),
          tools: tools({ modelId, writer }),
          onError: (error) => {
            console.error('Error communicating with AI')
            console.error(JSON.stringify(error, null, 2))
          },
        })
        result.consumeStream()
        writer.merge(
          result.toUIMessageStream({
            sendReasoning: true,
            sendStart: false,
            messageMetadata: () => ({
              model: model.name,
            }),
          })
        )
      },
    }),
  })
}
