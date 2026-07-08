import { describe, expect, it } from 'vitest';
import { getStadiumZoneById, STADIUM_GRAPH, STADIUM_ZONES } from '../data/stadium-graph';

describe('stadium graph data', () => {
  it('keeps selectable zones limited to gates and sections', () => {
    expect(STADIUM_ZONES).toHaveLength(16);
    expect(STADIUM_ZONES.every((zone) => zone.type === 'gate' || zone.type === 'section')).toBe(
      true
    );
  });

  it('looks up selectable zones by id', () => {
    expect(getStadiumZoneById('gate-4')?.name).toContain('Gate 4');
    expect(getStadiumZoneById('transit-metro-north')).toBeUndefined();
  });

  it('includes post-match transport and parking facilities in graph context', () => {
    const transportNodes = STADIUM_GRAPH.nodes.filter(
      (node) => node.category === 'transport' || node.category === 'parking'
    );

    expect(transportNodes.map((node) => node.name)).toEqual([
      'Metro Exit M1',
      'Bus Hub B2',
      'Parking Exit A',
      'Parking Exit B',
    ]);
    expect(transportNodes.every((node) => node.details?.includes('Typical post-match wait'))).toBe(
      true
    );
  });
});
