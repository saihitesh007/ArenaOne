import { describe, it, expect } from 'vitest';
import { STADIUM_GRAPH, getStadiumZoneById } from '../data/stadium-graph';

describe('Stadium Graph Transport Data', () => {
  it('should contain transport and parking nodes', () => {
    const transportNodes = STADIUM_GRAPH.nodes.filter(
      (node) => node.category === 'transport' || node.category === 'parking'
    );
    expect(transportNodes.length).toBeGreaterThan(0);
    
    // Check specific nodes that provide post-match assistance
    const metroNode = STADIUM_GRAPH.nodes.find(n => n.id === 'transit-metro-north');
    expect(metroNode).toBeDefined();
    expect(metroNode?.category).toBe('transport');
    expect(metroNode?.details).toContain('wait: 12-18 minutes');

    const parkingNode = STADIUM_GRAPH.nodes.find(n => n.id === 'parking-exit-b');
    expect(parkingNode).toBeDefined();
    expect(parkingNode?.category).toBe('parking');
  });

  it('should correctly identify stadium zones', () => {
    const gate = getStadiumZoneById('gate-4');
    expect(gate).toBeDefined();
    expect(gate?.name).toContain('Gate 4');
  });
});
