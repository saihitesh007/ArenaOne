import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateContent } from '@/lib/gemini';
import { GET, POST } from '../health/route';

vi.mock('@/lib/gemini', () => ({
  generateContent: vi.fn(),
  isGeminiConfigured: vi.fn(() => true),
}));

type JsonObject = Record<string, unknown>;

function healthRequest(body: JsonObject, ip: string): Request {
  return new Request('http://localhost/api/health', {
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

describe('/api/health route', () => {
  const mockedGenerateContent = vi.mocked(generateContent);

  beforeEach(() => {
    mockedGenerateContent.mockReset();
  });

  it('returns service status without calling Gemini', async () => {
    const response = await GET();
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json.status).toBe('ok');
    expect(json.service).toBe('ArenaOne');
    expect(mockedGenerateContent).not.toHaveBeenCalled();
  });

  it('returns a Gemini-backed health response', async () => {
    mockedGenerateContent.mockResolvedValue({
      text: 'ArenaOne is healthy.',
      model: 'gemini-2.5-flash',
      fallback: false,
    });

    const response = await POST(
      healthRequest({ prompt: 'health check' }, 'health-success')
    );
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json.response).toBe('ArenaOne is healthy.');
    expect(json.fallback).toBe(false);
  });

  it('returns provider fallback content when Gemini falls back', async () => {
    mockedGenerateContent.mockResolvedValue({
      text: 'ArenaOne is online. AI services are temporarily unavailable.',
      model: 'fallback',
      fallback: true,
    });

    const response = await POST(
      healthRequest({ prompt: 'health check' }, 'health-fallback')
    );
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json.fallback).toBe(true);
    expect(json.model).toBe('fallback');
  });

  it('rate-limits after 10 health POST requests', async () => {
    mockedGenerateContent.mockResolvedValue({
      text: 'ok',
      model: 'gemini-2.5-flash',
      fallback: false,
    });

    for (let requestIndex = 0; requestIndex < 10; requestIndex += 1) {
      const response = await POST(
        healthRequest({ prompt: `health ${requestIndex}` }, 'health-rate-limit')
      );
      expect(response.status).toBe(200);
    }

    const limitedResponse = await POST(
      healthRequest({ prompt: 'too many' }, 'health-rate-limit')
    );

    expect(limitedResponse.status).toBe(429);
  });
});
