import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('Chat API Route', () => {
  it('should fallback to deterministic concession response when food keyword is present', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'I want food' })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.provider).toBe('deterministic');
    expect(body.suggested_action).toBe('route_food');
    expect(body.reply).toBeDefined();
  });

  it('should fallback to deterministic exit response when gate keyword is present', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Where is the nearest exit gate?' })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.suggested_action).toBe('route_exit');
  });
});
