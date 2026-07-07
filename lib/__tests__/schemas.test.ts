import { describe, it, expect } from 'vitest';
import { chatRequestSchema, healthCheckSchema, zoneCheckInSchema } from '../schemas';

describe('Zod Input Schemas', () => {
  describe('healthCheckSchema', () => {
    it('should validate correct prompts', () => {
      const result = healthCheckSchema.safeParse({ prompt: 'Hello ArenaOne' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt).toBe('Hello ArenaOne');
      }
    });

    it('should reject empty prompts', () => {
      const result = healthCheckSchema.safeParse({ prompt: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.prompt?._errors[0]).toBe('Prompt cannot be empty');
      }
    });

    it('should reject prompts exceeding 500 characters', () => {
      const longPrompt = 'a'.repeat(501);
      const result = healthCheckSchema.safeParse({ prompt: longPrompt });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.prompt?._errors[0]).toBe('Prompt must be 500 characters or fewer');
      }
    });

    it('should accept prompts exactly 500 characters long', () => {
      const exactPrompt = 'a'.repeat(500);
      const result = healthCheckSchema.safeParse({ prompt: exactPrompt });
      expect(result.success).toBe(true);
    });

    it('should reject missing prompt key', () => {
      const result = healthCheckSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid types', () => {
      const result = healthCheckSchema.safeParse({ prompt: 12345 });
      expect(result.success).toBe(false);
    });
  });

  describe('chatRequestSchema', () => {
    it('should validate correct chat requests', () => {
      const result = chatRequestSchema.safeParse({
        message: 'Where is the nearest accessible washroom?',
        accessibilityMode: true,
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty chat messages', () => {
      const result = chatRequestSchema.safeParse({
        message: '',
        accessibilityMode: false,
      });

      expect(result.success).toBe(false);
    });

    it('should require accessibilityMode as a boolean', () => {
      const result = chatRequestSchema.safeParse({
        message: 'Where is Gate 4?',
        accessibilityMode: 'yes',
      });

      expect(result.success).toBe(false);
    });

    it('should allow optional currentZoneId for chat context', () => {
      const result = chatRequestSchema.safeParse({
        message: 'How do I get food?',
        accessibilityMode: false,
        currentZoneId: 'gate-4',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('zoneCheckInSchema', () => {
    it('should validate anonymous zone check-ins', () => {
      const result = zoneCheckInSchema.safeParse({
        zoneId: 'gate-4',
        anonymousSessionId: 'anon_123456789',
      });

      expect(result.success).toBe(true);
    });

    it('should reject short anonymous session ids', () => {
      const result = zoneCheckInSchema.safeParse({
        zoneId: 'gate-4',
        anonymousSessionId: 'short',
      });

      expect(result.success).toBe(false);
    });
  });
});
