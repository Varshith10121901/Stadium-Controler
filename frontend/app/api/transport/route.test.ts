import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('Transport API Route', () => {
  it('should recommend departure options based on exit gate and density parameters', async () => {
    const req = new Request('http://localhost/api/transport?gate=Gate%20A&density=0.8&lang=es');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.gate).toBe('Gate A');
    expect(body.density).toBe(0.8);
    expect(body.recommended_mode).toBeDefined();
    expect(body.alternates.length).toBeGreaterThan(0);
    expect(body.provider).toBe('deterministic');
  });

  it('should fallback to defaults when parameters are missing', async () => {
    const req = new Request('http://localhost/api/transport');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.gate).toBe('Gate A');
    expect(body.density).toBe(0.3); // Default density
  });
});
