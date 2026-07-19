import { describe, it, expect } from 'vitest';
import { stepAgents, createAgents } from './simulation';
import type { Agent } from './store';

describe('Game-Theoretic Simulation Engine', () => {
  it('should create agents with deterministic parameters', () => {
    const agents = createAgents(50, 42); // count = 50, seed = 42
    expect(agents.length).toBe(50);
    expect(agents[0].agent_id).toBeDefined();
    expect(agents[0].wait_time).toBe(0);
  });

  it('should negotiate pass priority based on utility scores when swarm is enabled', () => {
    // Put two agents very close to each other so they trigger negotiation
    // Coordinates: (10, 10)
    const agentA = {
      agent_id: 'agent_a',
      x: 10,
      y: 10,
      vx: 0.5,
      vy: 0.5,
      velocity: 1.0,
      goal: 'seat',
      goal_x: 20,
      goal_y: 20,
      path: [],
      group_id: null,
      swarm_points: 10,
      wait_time: 10,       // Higher wait time
      preference: 'restroom',
      cooperation_score: 0.8, // Utility = 10 * 0.8 = 8.0
      satisfaction: 1.0,
      is_real: true,
      status: 'moving',
      negotiation_count: 0
    } as Agent;

    const agentB = {
      agent_id: 'agent_b',
      x: 10.1,            // Within NEGOTIATION_RADIUS (1.5)
      y: 10.1,
      vx: 0.5,
      vy: 0.5,
      velocity: 1.0,
      goal: 'seat',
      goal_x: 20,
      goal_y: 20,
      path: [],
      group_id: null,
      swarm_points: 10,
      wait_time: 5,        // Lower wait time
      preference: 'restroom',
      cooperation_score: 1.0, // Utility = 5 * 1.0 = 5.0
      satisfaction: 1.0,
      is_real: true,
      status: 'moving',
      negotiation_count: 0
    } as Agent;

    const agents = [agentA, agentB];
    const opts = {
      swarmEnabled: true,
      seatingMode: false,
      emergency: false,
      speed: 1,
      dt: 0.2
    };

    // Run one simulation step
    const result = stepAgents(agents, opts, 1);

    // Agent A has higher utility (8.0 > 5.0), so Agent B should yield (slow down).
    // Let's verify that negotiation_count has updated on the winner
    expect(result.find(a => a.agent_id === 'agent_a')?.negotiation_count).toBe(1);
    expect(result.find(a => a.agent_id === 'agent_b')?.negotiation_count).toBe(0);
  });

  it('should not negotiate when swarm is disabled', () => {
    const agentA = {
      agent_id: 'agent_a',
      x: 10,
      y: 10,
      vx: 0.5,
      vy: 0.5,
      velocity: 1.0,
      goal: 'seat',
      goal_x: 20,
      goal_y: 20,
      path: [],
      group_id: null,
      swarm_points: 10,
      wait_time: 10,
      preference: 'restroom',
      cooperation_score: 0.8,
      satisfaction: 1.0,
      is_real: true,
      status: 'moving',
      negotiation_count: 0
    } as Agent;

    const agentB = {
      agent_id: 'agent_b',
      x: 10.1,
      y: 10.1,
      vx: 0.5,
      vy: 0.5,
      velocity: 1.0,
      goal: 'seat',
      goal_x: 20,
      goal_y: 20,
      path: [],
      group_id: null,
      swarm_points: 10,
      wait_time: 5,
      preference: 'restroom',
      cooperation_score: 1.0,
      satisfaction: 1.0,
      is_real: true,
      status: 'moving',
      negotiation_count: 0
    } as Agent;

    const agents = [agentA, agentB];
    const opts = {
      swarmEnabled: false, // SWARM DISABLED
      seatingMode: false,
      emergency: false,
      speed: 1,
      dt: 0.2
    };

    const result = stepAgents(agents, opts, 1);

    // Neither agent should increment negotiation count
    expect(result[0].negotiation_count).toBe(0);
    expect(result[1].negotiation_count).toBe(0);
  });
});
