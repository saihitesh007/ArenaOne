import { NextResponse } from 'next/server';
import { getStadiumZoneById } from '@/lib/data/stadium-graph';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { zoneCheckInSchema } from '@/lib/schemas';
import { writeCrowdDensitySignal } from '@/lib/crowd-density';

const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = rateLimit(`zone-check-in:${clientIp}`, RATE_LIMIT, RATE_WINDOW_MS);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many check-ins. Please try again in a minute.' },
      { status: 429 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const validation = zoneCheckInSchema.safeParse(body);

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
    await writeCrowdDensitySignal({
      zoneId: zone.id,
      source: 'fan_check_in',
      category: 'crowd',
      anonymousSessionId: validation.data.anonymousSessionId,
      timestamp: new Date().toISOString(),
      note: 'Self-reported fan zone check-in',
    });

    return NextResponse.json({
      ok: true,
      zoneId: zone.id,
      zoneName: zone.name,
      source: 'fan_check_in',
    });
  } catch (error) {
    console.error('[ArenaOne] zone check-in Firestore write failed:', error);

    return NextResponse.json(
      { error: 'Unable to save check-in right now' },
      { status: 503 }
    );
  }
}
