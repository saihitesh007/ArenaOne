import { GoogleGenAI } from '@google/genai';

/**
 * Gemini AI client singleton and helper functions.
 * All Gemini API calls are routed through this module — never from client-side code.
 *
 * Features:
 * - Singleton client initialization
 * - Graceful fallback when API is unavailable or rate-limited
 * - Configurable model and system instructions
 */

const GEMINI_MODEL = 'gemini-2.5-flash';

const FALLBACK_RESPONSE = 'ArenaOne is online. AI services are temporarily unavailable. Please try again shortly.';

let _client: GoogleGenAI | null = null;

/**
 * Returns the Gemini client singleton.
 * Returns null if GEMINI_API_KEY is not configured.
 *
 * @returns Configured Gemini client or null when unavailable.
 */
function getClient(): GoogleGenAI | null {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      '[ArenaOne] GEMINI_API_KEY not configured. AI features will use fallback responses.'
    );
    return null;
  }

  _client = new GoogleGenAI({ apiKey });
  return _client;
}

export interface GeminiResponse {
  text: string;
  model: string;
  fallback: boolean;
}

/**
 * Generates content using the Gemini API with graceful fallback.
 *
 * @param prompt - The user prompt to send to Gemini
 * @param systemInstruction - Optional system instruction to guide the model's behavior
 * @returns GeminiResponse with the generated text, model used, and fallback flag
 */
export async function generateContent(
  prompt: string,
  systemInstruction?: string
): Promise<GeminiResponse> {
  const client = getClient();

  if (!client) {
    return {
      text: FALLBACK_RESPONSE,
      model: 'fallback',
      fallback: true,
    };
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: systemInstruction
        ? { systemInstruction }
        : undefined,
    });

    const text = response.text ?? FALLBACK_RESPONSE;

    return {
      text,
      model: GEMINI_MODEL,
      fallback: false,
    };
  } catch (error) {
    console.error('[ArenaOne] Gemini API raw error object:', error);

    // Determine if it's a rate limit error for specific messaging
    const isRateLimit =
      error instanceof Error &&
      (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'));

    return {
      text: isRateLimit
        ? 'ArenaOne AI is experiencing high demand. Please try again in a moment.'
        : FALLBACK_RESPONSE,
      model: 'fallback',
      fallback: true,
    };
  }
}

/**
 * Checks if the Gemini client is properly configured.
 * Useful for health checks.
 *
 * @returns True when GEMINI_API_KEY exists in the server environment.
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
