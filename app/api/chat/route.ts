import { LRUCache } from 'lru-cache';
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

/**
 * In-memory response cache for identical chat queries.
 * Key: normalised `message|accessibilityMode|zoneId` string.
 * TTL: 10 minutes — long enough to absorb repeated identical questions during
 * a single matchday session, short enough to stay fresh as the situation evolves.
 * Max 200 entries covers the full set of suggested prompts many times over
 * without consuming significant memory (~200 KB worst-case).
 */
const chatCache = new LRUCache<string, string>({
  max: 200,
  ttl: 10 * 60 * 1000, // 10 minutes
});

function buildCacheKey(message: string, accessibilityMode: boolean, zoneId?: string): string {
  return `${message.trim().toLowerCase()}|${accessibilityMode}|${zoneId ?? ''}`;
}

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

  const { message, accessibilityMode, currentZoneId } = validation.data;

  // Check cache before calling Gemini
  const cacheKey = buildCacheKey(message, accessibilityMode, currentZoneId);
  const cachedResponse = chatCache.get(cacheKey);
  if (cachedResponse) {
    return NextResponse.json({
      response: cachedResponse,
      model: 'cached',
      fallback: false,
      geminiConfigured: isGeminiConfigured(),
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { prompt, systemInstruction } = buildChatPrompt({
      message,
      accessibilityMode,
      currentZoneId,
      stadiumGraph: STADIUM_GRAPH,
    });

    const result = await generateContent(prompt, systemInstruction);

    const responseText = result.fallback ? CHAT_FALLBACK : result.text;

    // Only cache successful Gemini responses, not fallbacks
    if (!result.fallback) {
      chatCache.set(cacheKey, responseText);
    }

    return NextResponse.json({
      response: responseText,
      model: result.model,
      fallback: result.fallback,
      geminiConfigured: isGeminiConfigured(),
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ArenaOne] /api/chat error:', error);

    return NextResponse.json({
      response: CHAT_FALLBACK,
      model: 'fallback',
      fallback: true,
      geminiConfigured: isGeminiConfigured(),
      cached: false,
      timestamp: new Date().toISOString(),
    });
  }
}
