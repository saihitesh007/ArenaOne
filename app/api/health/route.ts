import { NextResponse } from 'next/server';
import { generateContent, isGeminiConfigured } from '@/lib/gemini';
import { healthCheckSchema } from '@/lib/schemas';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/health
 *
 * Health-check endpoint that validates the Gemini API connection.
 * Accepts a prompt, sends it to Gemini, and returns the response.
 *
 * Features:
 * - Zod input validation
 * - Rate limiting (10 requests/minute per IP)
 * - Graceful fallback on Gemini failure
 *
 * Request body: { prompt: string }
 * Response: { response: string, model: string, timestamp: string, fallback: boolean }
 */

const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

const SYSTEM_INSTRUCTION =
  'You are ArenaOne, an AI assistant for FIFA World Cup 2026 stadium operations. ' +
  'You help fans navigate stadiums, find facilities, and get real-time information. ' +
  'Respond concisely and helpfully. Keep responses under 3 sentences for health checks.';

export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(clientIp, RATE_LIMIT, RATE_WINDOW_MS);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
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

    // 2. Parse and validate input
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = healthCheckSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    // 3. Call Gemini
    const { prompt } = validation.data;
    const result = await generateContent(prompt, SYSTEM_INSTRUCTION);

    // 4. Return response
    return NextResponse.json({
      response: result.text,
      model: result.model,
      timestamp: new Date().toISOString(),
      fallback: result.fallback,
      geminiConfigured: isGeminiConfigured(),
    });
  } catch (error) {
    console.error('[ArenaOne] /api/health error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health
 * Simple health check — no Gemini call, just confirms the API is running.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ArenaOne',
    geminiConfigured: isGeminiConfigured(),
    timestamp: new Date().toISOString(),
  });
}
