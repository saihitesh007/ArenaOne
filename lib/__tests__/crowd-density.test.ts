import { describe, expect, it } from 'vitest';
import { aggregateCrowdDensitySignals, CROWD_DENSITY_COLLECTION } from '../crowd-density';

describe('crowd-density helpers', () => {
  it('uses one shared collection for staff reports and fan check-ins', () => {
    expect(CROWD_DENSITY_COLLECTION).toBe('crowdDensityReports');
  });

  it('aggregates staff reports and fan check-ins into one zone density summary', () => {
    const result = aggregateCrowdDensitySignals([
      { zoneId: 'gate-4', source: 'staff_report' },
      { zoneId: 'gate-4', source: 'fan_check_in', anonymousSessionId: 'anon_1' },
      { zoneId: 'gate-4', source: 'staff_report', category: 'transport' },
      { zoneId: 'sec-c', source: 'fan_check_in', anonymousSessionId: 'anon_2' },
      { zoneId: 'gate-4', source: 'fan_check_in', anonymousSessionId: 'anon_3' },
    ]);

    expect(result[0]).toEqual({
      zoneId: 'gate-4',
      staffReports: 2,
      fanCheckIns: 2,
      totalSignals: 4,
    });
    expect(result[1]).toEqual({
      zoneId: 'sec-c',
      staffReports: 0,
      fanCheckIns: 1,
      totalSignals: 1,
    });
  });

  it('returns an empty array for zero signals', () => {
    expect(aggregateCrowdDensitySignals([])).toEqual([]);
  });

  it('counts correctly when all signals are from a single source type', () => {
    const result = aggregateCrowdDensitySignals([
      { zoneId: 'gate-1', source: 'staff_report', category: 'crowd' },
      { zoneId: 'gate-1', source: 'staff_report', category: 'transport' },
      { zoneId: 'gate-1', source: 'staff_report', category: 'sustainability' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      zoneId: 'gate-1',
      staffReports: 3,
      fanCheckIns: 0,
      totalSignals: 3,
    });
  });

  it('sorts zones from highest to lowest total signal count', () => {
    const result = aggregateCrowdDensitySignals([
      { zoneId: 'sec-a', source: 'fan_check_in' },
      { zoneId: 'gate-8', source: 'staff_report' },
      { zoneId: 'gate-8', source: 'fan_check_in' },
      { zoneId: 'gate-8', source: 'fan_check_in' },
    ]);

    expect(result[0].zoneId).toBe('gate-8');
    expect(result[0].totalSignals).toBe(3);
    expect(result[1].zoneId).toBe('sec-a');
    expect(result[1].totalSignals).toBe(1);
  });
});
