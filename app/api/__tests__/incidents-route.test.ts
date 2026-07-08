import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateIncidentDraft, saveIncident } from '@/lib/incidents';
import { POST } from '../incidents/route';

vi.mock('@/lib/incidents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/incidents')>();

  return {
    ...actual,
    generateIncidentDraft: vi.fn(),
    saveIncident: vi.fn(),
  };
});

type JsonObject = Record<string, unknown>;

function incidentRequest(body: JsonObject, ip: string): Request {
  return new Request('http://localhost/api/incidents', {
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

const structuredIncident = {
  incidentId: 'INC-20260708203000',
  location: 'Section D',
  category: 'lost_person' as const,
  priority: 'high' as const,
  suggestedAction: 'Send nearest steward to Section D.',
  summary: 'Child lost near Section D wearing a blue jersey.',
};

describe('/api/incidents route', () => {
  const mockedGenerateIncidentDraft = vi.mocked(generateIncidentDraft);
  const mockedSaveIncident = vi.mocked(saveIncident);

  beforeEach(() => {
    mockedGenerateIncidentDraft.mockReset();
    mockedSaveIncident.mockReset();
    mockedGenerateIncidentDraft.mockResolvedValue({
      incident: structuredIncident,
      fallback: false,
      model: 'gemini-2.5-flash',
    });
    mockedSaveIncident.mockResolvedValue({ id: 'incident-doc' });
  });

  it('generates and stores a structured incident', async () => {
    const response = await POST(
      incidentRequest(
        {
          description: 'kid lost near section D wearing blue jersey',
          reporterRole: 'volunteer',
        },
        'incident-success'
      )
    );
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json.documentId).toBe('incident-doc');
    expect(json.fallback).toBe(false);
    expect(mockedGenerateIncidentDraft).toHaveBeenCalledWith({
      description: 'kid lost near section D wearing blue jersey',
      reporterRole: 'volunteer',
    });
    expect(mockedSaveIncident).toHaveBeenCalledWith(structuredIncident);
  });

  it('returns fallback metadata when Gemini fallback structures the report', async () => {
    mockedGenerateIncidentDraft.mockResolvedValue({
      incident: structuredIncident,
      fallback: true,
      model: 'fallback',
    });

    const response = await POST(
      incidentRequest(
        {
          description: 'guest needs wheelchair help near gate 4',
        },
        'incident-fallback'
      )
    );
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json.fallback).toBe(true);
    expect(json.model).toBe('fallback');
  });

  it('returns a graceful error when saving fails', async () => {
    mockedSaveIncident.mockRejectedValue(new Error('Firestore unavailable'));

    const response = await POST(
      incidentRequest(
        {
          description: 'guest needs medical help near section F',
        },
        'incident-save-failure'
      )
    );
    const json = await readJson(response);

    expect(response.status).toBe(503);
    expect(json.error).toBe('Unable to submit incident right now');
  });

  it('rate-limits repeated incident submissions', async () => {
    for (let requestIndex = 0; requestIndex < 12; requestIndex += 1) {
      const response = await POST(
        incidentRequest(
          {
            description: `incident report near gate 4 number ${requestIndex}`,
          },
          'incident-rate-limit'
        )
      );
      expect(response.status).toBe(200);
    }

    const limitedResponse = await POST(
      incidentRequest(
        {
          description: 'one more incident report near gate 4',
        },
        'incident-rate-limit'
      )
    );

    expect(limitedResponse.status).toBe(429);
  });
});
