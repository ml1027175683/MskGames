import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchBackendColorInventory, login, mineBackendColor, register } from './gameApi';

describe('gameApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mines one color from backend API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ red: 231, green: 76, blue: 60, rarity: 'legendary' })));

    const mined = await mineBackendColor('token-123');

    expect(fetch).toHaveBeenCalledWith('/api/v1/mining/tick', { headers: { Authorization: 'Bearer token-123' }, method: 'POST' });
    expect(mined.color).toEqual({ r: 231, g: 76, b: 60 });
    expect(mined.rarity.label).toBe('传说');
  });

  it('fetches color inventory from backend API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [{ color: { red: 231, green: 76, blue: 60, rarity: 'legendary' }, quantity: 3 }] }))
    );

    const inventory = await fetchBackendColorInventory('token-123');

    expect(fetch).toHaveBeenCalledWith('/api/v1/inventory/colors', { headers: { Authorization: 'Bearer token-123' } });
    expect(inventory).toEqual([{ color: { r: 231, g: 76, b: 60 }, quantity: 3, rarity: expect.objectContaining({ label: '传说' }) }]);
  });

  it('registers a user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 2, username: 'alice', displayName: 'Alice' }, token: 'token-123' }))
    );

    const result = await register({ username: 'alice', displayName: 'Alice', password: 'secret123' });

    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/register', {
      body: JSON.stringify({ username: 'alice', displayName: 'Alice', password: 'secret123' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    });
    expect(result.token).toBe('token-123');
  });

  it('logs in a user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 2, username: 'alice', displayName: 'Alice' }, token: 'token-123' }))
    );

    const result = await login({ username: 'alice', password: 'secret123' });

    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login', {
      body: JSON.stringify({ username: 'alice', password: 'secret123' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    });
    expect(result.user.username).toBe('alice');
  });
});
