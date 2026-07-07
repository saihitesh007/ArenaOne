import { NextResponse } from 'next/server';
import { buildChatPrompt } from '@/lib/chat-utils';
import { STADIUM_GRAPH } from '@/lib/data/stadium-graph';
import { generateContent, isGeminiConfigured } from '@/lib/gemini';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { chatRequestSchema } from '@/lib/schemas';

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const CHAT_FALLBACK =
  "I'm having trouble connecting to the stadium database. Please follow the signs to the nearest info booth.";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = rateLimit(`chat:${clientIp}`, RATE_LIMIT, RATE_WINDOW_MS);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many chat requests. Please try again in a minute.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const validation = chatRequestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.format() },
      { status: 400 }
    );
  }

  try {
    const { prompt, systemInstruction } = buildChatPrompt({
      message: validation.data.message,
      accessibilityMode: validation.data.accessibilityMode,
      stadiumGraph: STADIUM_GRAPH,
    });

    const result = await generateContent(prompt, systemInstruction);

    return NextResponse.json({
      response: result.fallback ? CHAT_FALLBACK : result.text,
      model: result.model,
      fallback: result.fallback,
      geminiConfigured: isGeminiConfigured(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ArenaOne] /api/chat error:', error);

    return NextResponse.json({
      response: CHAT_FALLBACK,
      model: 'fallback',
      fallback: true,
      geminiConfigured: isGeminiConfigured(),
      timestamp: new Date().toISOString(),
    });
  }
}
