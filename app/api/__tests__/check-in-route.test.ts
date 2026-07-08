import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writeCrowdDensitySignal } from '@/lib/crowd-density';
import { POST } from '../crowd-density/check-in/route';

vi.mock('@/lib/crowd-density', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/crowd-density')>();

  return {
    ...actual,
    writeCrowdDensitySignal: vi.fn(),
  };
});

type JsonObject = Record<string, unknown>;

function checkInRequest(body: JsonObject, ip: string): Request {
  return new Request('http://localhost/api/crowd-density/check-in', {
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

describe('/api/crowd-density/check-in route', () => {
  const mockedWriteCrowdDensitySignal = vi.mocked(writeCrowdDensitySignal);

  beforeEach(() => {
    mockedWriteCrowdDensitySignal.mockReset();
    mockedWriteCrowdDensitySignal.mockResolvedValue({ id: 'density-doc' });
  });

  it('writes an anonymous fan check-in into the shared density pipeline', async () => {
    const response = await POST(
      checkInRequest(
        {
          zoneId: 'gate-4',
          anonymousSessionId: 'anon_123456789',
        },
        'check-in-success'
      )
    );
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json.zoneId).toBe('gate-4');
    expect(json.source).toBe('fan_check_in');
    expect(mockedWriteCrowdDensitySignal).toHaveBeenCalledWith(
      expect.objectContaining({
        zoneId: 'gate-4',
        source: 'fan_check_in',
        category: 'crowd',
      })
    );
  });

  it('returns a graceful error when Firestore write fails', async () => {
    mockedWriteCrowdDensitySignal.mockRejectedValue(new Error('Firestore unavailable'));

    const response = await POST(
      checkInRequest(
        {
          zoneId: 'gate-4',
          anonymousSessionId: 'anon_987654321',
        },
        'check-in-failure'
      )
    );
    const json = await readJson(response);

    expect(response.status).toBe(503);
    expect(json.error).toBe('Unable to save check-in right now');
  });

  it('rate-limits repeated check-ins', async () => {
    for (let requestIndex = 0; requestIndex < 12; requestIndex += 1) {
      const response = await POST(
        checkInRequest(
          {
            zoneId: 'gate-4',
            anonymousSessionId: `anon_rate_${requestIndex}`,
          },
          'check-in-rate-limit'
        )
      );
      expect(response.status).toBe(200);
    }

    const limitedResponse = await POST(
      checkInRequest(
        {
          zoneId: 'gate-4',
          anonymousSessionId: 'anon_rate_limited',
        },
        'check-in-rate-limit'
      )
    );

    expect(limitedResponse.status).toBe(429);
  });
});
