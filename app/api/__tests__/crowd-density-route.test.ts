import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writeCrowdDensitySignal } from '@/lib/crowd-density';
import { POST } from '../crowd-density/route';

vi.mock('@/lib/crowd-density', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/crowd-density')>();

  return {
    ...actual,
    writeCrowdDensitySignal: vi.fn(),
  };
});

type JsonObject = Record<string, unknown>;

function crowdReportRequest(body: JsonObject, ip: string): Request {
  return new Request('http://localhost/api/crowd-density', {
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

describe('/api/crowd-density route', () => {
  const mockedWriteCrowdDensitySignal = vi.mocked(writeCrowdDensitySignal);

  beforeEach(() => {
    mockedWriteCrowdDensitySignal.mockReset();
    mockedWriteCrowdDensitySignal.mockResolvedValue({ id: 'crowd-doc' });
  });

  it('stores a staff transport congestion report in the shared pipeline', async () => {
    const response = await POST(
      crowdReportRequest(
        {
          zoneId: 'gate-4',
          category: 'transport',
          note: 'Parking Exit B blocked',
        },
        'crowd-density-success'
      )
    );
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json.category).toBe('transport');
    expect(json.source).toBe('staff_report');
    expect(mockedWriteCrowdDensitySignal).toHaveBeenCalledWith(
      expect.objectContaining({
        zoneId: 'gate-4',
        source: 'staff_report',
        category: 'transport',
      })
    );
  });

  it('returns a graceful error when Firestore write fails', async () => {
    mockedWriteCrowdDensitySignal.mockRejectedValue(new Error('Firestore unavailable'));

    const response = await POST(
      crowdReportRequest(
        {
          zoneId: 'gate-4',
          category: 'crowd',
          note: 'Gate 4 very crowded',
        },
        'crowd-density-failure'
      )
    );
    const json = await readJson(response);

    expect(response.status).toBe(503);
    expect(json.error).toBe('Unable to save crowd-density report right now');
  });

  it('rate-limits repeated crowd-density reports', async () => {
    for (let requestIndex = 0; requestIndex < 20; requestIndex += 1) {
      const response = await POST(
        crowdReportRequest(
          {
            zoneId: 'gate-4',
            category: 'crowd',
            note: `Gate 4 report ${requestIndex}`,
          },
          'crowd-density-rate-limit'
        )
      );
      expect(response.status).toBe(200);
    }

    const limitedResponse = await POST(
      crowdReportRequest(
        {
          zoneId: 'gate-4',
          category: 'crowd',
          note: 'too many reports',
        },
        'crowd-density-rate-limit'
      )
    );

    expect(limitedResponse.status).toBe(429);
  });
});
