import { NextResponse } from 'next/server';
import { generateIncidentDraft, saveIncident } from '@/lib/incidents';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { incidentSubmissionSchema } from '@/lib/schemas';

const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = rateLimit(`incident:${clientIp}`, RATE_LIMIT, RATE_WINDOW_MS);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many incident submissions. Please try again in a minute.' },
      { status: 429 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const validation = incidentSubmissionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.format() },
      { status: 400 }
    );
  }

  try {
    const result = await generateIncidentDraft(validation.data);
    const savedIncident = await saveIncident(result.incident);

    return NextResponse.json({
      incident: result.incident,
      documentId: savedIncident.id,
      fallback: result.fallback,
      model: result.model,
    });
  } catch (error) {
    console.error('[ArenaOne] /api/incidents error:', error);

    return NextResponse.json(
      { error: 'Unable to submit incident right now' },
      { status: 503 }
    );
  }
}
