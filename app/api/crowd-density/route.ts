import { NextResponse } from 'next/server';
import { writeCrowdDensitySignal } from '@/lib/crowd-density';
import { getStadiumZoneById } from '@/lib/data/stadium-graph';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { crowdDensityReportSchema } from '@/lib/schemas';

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = rateLimit(`crowd-density:${clientIp}`, RATE_LIMIT, RATE_WINDOW_MS);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many crowd-density reports. Please try again in a minute.' },
      { status: 429 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const validation = crowdDensityReportSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.format() },
      { status: 400 }
    );
  }

  const zone = getStadiumZoneById(validation.data.zoneId);

  if (!zone) {
    return NextResponse.json({ error: 'Unknown stadium zone' }, { status: 400 });
  }

  try {
    const document = await writeCrowdDensitySignal({
      zoneId: zone.id,
      source: 'staff_report',
      category: validation.data.category,
      note: validation.data.note,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      documentId: document.id,
      zoneId: zone.id,
      zoneName: zone.name,
      category: validation.data.category,
      source: 'staff_report',
    });
  } catch (error) {
    console.error('[ArenaOne] /api/crowd-density error:', error);

    return NextResponse.json(
      { error: 'Unable to save crowd-density report right now' },
      { status: 503 }
    );
  }
}
