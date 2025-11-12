import { Models } from '@/ai/constants'
import { NextResponse } from 'next/server'
import { checkBotId } from 'botid/server'
import { generateObject } from 'ai'
import { linesSchema, resultSchema } from '@/components/error-monitor/schemas'
import { apiRateLimiter } from '@/lib/cache'
import prompt from './prompt.md'

export async function POST(req: Request) {
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

  const body = await req.json()
  const parsedBody = linesSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: `Invalid request` }, { status: 400 })
  }

  const result = await generateObject({
    system: prompt,
    model: Models.OpenAIGPT5,
    providerOptions: {
      openai: {
        include: ['reasoning.encrypted_content'],
        reasoningEffort: 'minimal',
        reasoningSummary: 'auto',
        serviceTier: 'priority',
      },
    },
    messages: [{ role: 'user', content: JSON.stringify(parsedBody.data) }],
    schema: resultSchema,
  })

  return NextResponse.json(result.object, {
    status: 200,
  })
}
