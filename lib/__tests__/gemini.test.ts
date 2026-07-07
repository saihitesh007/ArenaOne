import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateContent, isGeminiConfigured } from '../gemini';

// Mock the unified Gemini SDK
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: vi.fn().mockImplementation(async ({ contents }) => {
          if (contents === 'trigger-error') {
            throw new Error('API failure simulation');
          }
          if (contents === 'trigger-rate-limit') {
            throw new Error('429 RESOURCE_EXHAUSTED');
          }
          return {
            text: `Mocked response for: ${contents}`,
          };
        }),
      };
    },
  };
});

describe('Gemini Client Helper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should indicate configuration status correctly', () => {
    process.env.GEMINI_API_KEY = '';
    expect(isGeminiConfigured()).toBe(false);

    process.env.GEMINI_API_KEY = 'test-key';
    expect(isGeminiConfigured()).toBe(true);
  });

  it('should return fallback response when GEMINI_API_KEY is not configured', async () => {
    process.env.GEMINI_API_KEY = '';
    
    const result = await generateContent('hello');
    expect(result.fallback).toBe(true);
    expect(result.model).toBe('fallback');
    expect(result.text).toContain('AI services are temporarily unavailable');
  });

  it('should generate content successfully when key is set', async () => {
    process.env.GEMINI_API_KEY = 'valid-key';

    const result = await generateContent('test-prompt');
    expect(result.fallback).toBe(false);
    expect(result.model).toBe('gemini-2.5-flash');
    expect(result.text).toBe('Mocked response for: test-prompt');
  });

  it('should handle API errors gracefully with fallback responses', async () => {
    process.env.GEMINI_API_KEY = 'valid-key';

    const result = await generateContent('trigger-error');
    expect(result.fallback).toBe(true);
    expect(result.model).toBe('fallback');
    expect(result.text).toContain('AI services are temporarily unavailable');
  });

  it('should handle rate limits specifically', async () => {
    process.env.GEMINI_API_KEY = 'valid-key';

    const result = await generateContent('trigger-rate-limit');
    expect(result.fallback).toBe(true);
    expect(result.model).toBe('fallback');
    expect(result.text).toContain('high demand');
  });
});
