import { describe, it, expect } from 'vitest';
import { useSwarmStore } from './store';

describe('Zustand Swarm Store', () => {
  it('should initialize with default states', () => {
    const state = useSwarmStore.getState();
    expect(state.connected).toBe(false);
    expect(state.simulationRunning).toBe(false);
    expect(state.swarmEnabled).toBe(true);
    expect(state.agents).toEqual([]);
  });

  it('should update connection status', () => {
    useSwarmStore.getState().setConnected(true);
    expect(useSwarmStore.getState().connected).toBe(true);
    
    useSwarmStore.getState().setConnected(false);
    expect(useSwarmStore.getState().connected).toBe(false);
  });

  it('should update client ID', () => {
    useSwarmStore.getState().setClientId('test-client-123');
    expect(useSwarmStore.getState().clientId).toBe('test-client-123');
  });
});
