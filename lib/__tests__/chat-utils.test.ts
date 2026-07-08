import { describe, expect, it } from 'vitest';
import { buildChatPrompt } from '../chat-utils';

describe('buildChatPrompt', () => {
  it('builds a prompt with system instructions and fan message', () => {
    const result = buildChatPrompt({
      message: 'nearest accessible washroom to Gate 4',
      accessibilityMode: false,
    });

    expect(result.prompt).toContain('Fan message:');
    expect(result.prompt).toContain('nearest accessible washroom to Gate 4');
    expect(result.systemInstruction).toContain('same language');
    expect(result.systemInstruction).toContain('Do not fabricate');
    expect(result.systemInstruction).toContain('Gate 4 ->');
  });

  it('adds simple mode instructions when accessibilityMode is enabled', () => {
    const result = buildChatPrompt({
      message: 'Help me get to medical',
      accessibilityMode: true,
    });

    expect(result.systemInstruction).toContain('Accessibility Mode is ON');
    expect(result.systemInstruction).toContain('simple words');
    expect(result.systemInstruction).toContain('short sentences');
    expect(result.systemInstruction).toContain('step-by-step layout');
  });

  it('includes stadium graph context with facilities and paths', () => {
    const result = buildChatPrompt({
      message: 'Where can I buy vegetarian food?',
      accessibilityMode: false,
    });

    expect(result.systemInstruction).toContain('Gate 1');
    expect(result.systemInstruction).toContain('Gate 8');
    expect(result.systemInstruction).toContain('Accessible Washroom B');
    expect(result.systemInstruction).toContain('Green Bite');
    expect(result.systemInstruction).toContain('Veg Burger');
    expect(result.systemInstruction).toContain('Medical Point Alpha');
    expect(result.systemInstruction).toContain('gate-4 -> sec-d');
  });

  it('includes post-match transport and parking context', () => {
    const result = buildChatPrompt({
      message: 'Which parking exit should I use?',
      accessibilityMode: false,
    });

    expect(result.systemInstruction).toContain('Metro Exit M1');
    expect(result.systemInstruction).toContain('Bus Hub B2');
    expect(result.systemInstruction).toContain('Parking Exit B');
    expect(result.systemInstruction).toContain('Typical post-match wait');
  });

  it('includes current self-reported zone context when provided', () => {
    const result = buildChatPrompt({
      message: 'Where should I go for help?',
      accessibilityMode: false,
      currentZoneId: 'gate-4',
    });

    expect(result.systemInstruction).toContain('Current fan self-reported zone');
    expect(result.systemInstruction).toContain('Gate 4');
    expect(result.systemInstruction).toContain('not GPS or live tracking');
  });
});
