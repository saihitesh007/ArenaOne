import { FieldValue } from 'firebase-admin/firestore';
import { addFirestoreDocument } from './firestore-data';

export const CROWD_DENSITY_COLLECTION = 'crowdDensityReports';

export type CrowdDensitySource = 'staff_report' | 'fan_check_in';
export type CrowdDensityCategory = 'crowd' | 'sustainability' | 'transport';

export interface CrowdDensitySignal {
  zoneId: string;
  source: CrowdDensitySource;
  category?: CrowdDensityCategory;
  anonymousSessionId?: string;
  note?: string;
  timestamp?: string;
}

export interface CrowdDensityReportInput {
  zoneId: string;
  category?: CrowdDensityCategory;
  note: string;
}

export interface ZoneDensitySummary {
  zoneId: string;
  staffReports: number;
  fanCheckIns: number;
  totalSignals: number;
}

/**
 * Combines recent staff reports and anonymous fan check-ins by zone.
 *
 * @param signals - Raw density signals from the shared Firestore collection.
 * @returns Zone summaries sorted from highest to lowest total signal count.
 */
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

/**
 * Writes one crowd-density signal into the shared Firestore pipeline.
 *
 * @param signal - Staff or fan signal with zone id, source, optional category, and metadata.
 * @returns The Firestore document reference created for the signal.
 */
export async function writeCrowdDensitySignal(signal: CrowdDensitySignal) {
  return addFirestoreDocument(CROWD_DENSITY_COLLECTION, {
    zoneId: signal.zoneId,
    source: signal.source,
    category: signal.category ?? 'crowd',
    anonymousSessionId: signal.anonymousSessionId ?? null,
    note: signal.note ?? null,
    timestamp: FieldValue.serverTimestamp(),
    clientTimestamp: signal.timestamp ?? new Date().toISOString(),
  });
}
