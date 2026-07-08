import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateContent } from '@/lib/gemini';
import { POST } from '../chat/route';

vi.mock('@/lib/gemini', () => ({
  generateContent: vi.fn(),
  isGeminiConfigured: vi.fn(() => true),
}));

type JsonObject = Record<string, unknown>;

function chatRequest(body: JsonObject, ip: string): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

async function readJson(response: Response): Promise<JsonObject> {
  return (await response.json()) as JsonObject;
}

describe('/api/chat route', () => {
  const mockedGenerateContent = vi.mocked(generateContent);

  beforeEach(() => {
    mockedGenerateContent.mockReset();
  });

  it('returns a Gemini response with transport context available', async () => {
    mockedGenerateContent.mockResolvedValue({
      text: 'Use Metro Exit M1 after the match.',
      model: 'gemini-2.5-flash',
      fallback: false,
    });

    const response = await POST(
      chatRequest(
        {
          message: 'How do I get to the metro after the match?',
          accessibilityMode: false,
          currentZoneId: 'gate-1',
        },
        'chat-success-transport'
      )
    );
    const json = await readJson(response);
    const [, systemInstruction] = mockedGenerateContent.mock.calls[0];

    expect(response.status).toBe(200);
    expect(json.response).toBe('Use Metro Exit M1 after the match.');
    expect(systemInstruction).toContain('Metro Exit M1');
    expect(systemInstruction).toContain('Parking Exit B');
  });

  it('returns the chat fallback when Gemini falls back', async () => {
    mockedGenerateContent.mockResolvedValue({
      text: 'Provider fallback',
      model: 'fallback',
      fallback: true,
    });

    const response = await POST(
      chatRequest(
        {
          message: 'nearest accessible washroom',
          accessibilityMode: false,
        },
        'chat-fallback'
      )
    );
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json.fallback).toBe(true);
    expect(json.response).toContain('nearest info booth');
  });

  it('rate-limits after 20 requests per minute', async () => {
    mockedGenerateContent.mockResolvedValue({
      text: 'ok',
      model: 'gemini-2.5-flash',
      fallback: false,
    });

    for (let requestIndex = 0; requestIndex < 20; requestIndex += 1) {
      const response = await POST(
        chatRequest(
          {
            message: `hello ${requestIndex}`,
            accessibilityMode: false,
          },
          'chat-rate-limit'
        )
      );
      expect(response.status).toBe(200);
    }

    const limitedResponse = await POST(
      chatRequest(
        {
          message: 'one too many',
          accessibilityMode: false,
        },
        'chat-rate-limit'
      )
    );

    expect(limitedResponse.status).toBe(429);
  });
});
