import { describe, expect, it } from 'vitest';
import { createIncidentId, parseIncidentDraft } from '../incidents';

describe('incident helpers', () => {
  it('creates stable display incident ids from timestamps', () => {
    const id = createIncidentId(new Date('2026-07-08T20:30:45.000Z'));

    expect(id).toBe('INC-20260708203045');
  });

  it('parses structured incident JSON from Gemini', () => {
    const incident = parseIncidentDraft(
      JSON.stringify({
        incidentId: 'INC-1',
        location: 'Section D',
        category: 'lost_person',
        priority: 'high',
        suggestedAction: 'Send steward.',
        summary: 'Lost child near Section D.',
      }),
      'lost child'
    );

    expect(incident).toEqual({
      incidentId: 'INC-1',
      location: 'Section D',
      category: 'lost_person',
      priority: 'high',
      suggestedAction: 'Send steward.',
      summary: 'Lost child near Section D.',
    });
  });

  it('falls back when Gemini returns non-JSON text', () => {
    const incident = parseIncidentDraft('not json', 'guest needs help near Gate 4');

    expect(incident.location).toBe('Unknown stadium zone');
    expect(incident.category).toBe('general');
    expect(incident.priority).toBe('medium');
    expect(incident.summary).toBe('guest needs help near Gate 4');
  });
});
