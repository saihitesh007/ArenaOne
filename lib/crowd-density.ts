import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';

export const CROWD_DENSITY_COLLECTION = 'crowdDensityReports';

export type CrowdDensitySource = 'staff_report' | 'fan_check_in';

export interface CrowdDensitySignal {
  zoneId: string;
  source: CrowdDensitySource;
  anonymousSessionId?: string;
  note?: string;
  timestamp?: string;
}

export interface ZoneDensitySummary {
  zoneId: string;
  staffReports: number;
  fanCheckIns: number;
  totalSignals: number;
}

export function aggregateCrowdDensitySignals(
  signals: CrowdDensitySignal[]
): ZoneDensitySummary[] {
  const summaries = new Map<string, ZoneDensitySummary>();

  for (const signal of signals) {
    const current =
      summaries.get(signal.zoneId) ??
      {
        zoneId: signal.zoneId,
        staffReports: 0,
        fanCheckIns: 0,
        totalSignals: 0,
      };

    if (signal.source === 'fan_check_in') {
      current.fanCheckIns += 1;
    } else {
      current.staffReports += 1;
    }

    current.totalSignals += 1;
    summaries.set(signal.zoneId, current);
  }

  return [...summaries.values()].sort((a, b) => b.totalSignals - a.totalSignals);
}

export async function writeCrowdDensitySignal(signal: CrowdDensitySignal) {
  const db = getAdminDb();

  return db.collection(CROWD_DENSITY_COLLECTION).add({
    zoneId: signal.zoneId,
    source: signal.source,
    anonymousSessionId: signal.anonymousSessionId ?? null,
    note: signal.note ?? null,
    timestamp: FieldValue.serverTimestamp(),
    clientTimestamp: signal.timestamp ?? new Date().toISOString(),
  });
}
