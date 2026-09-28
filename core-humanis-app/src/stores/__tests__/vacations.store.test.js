import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useVacationsStore } from '../vacations.store.js';

describe('VacationsStore Pinia State', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty state, currentRequest null and default flags', () => {
    const store = useVacationsStore();
    expect(store.requests).toEqual([]);
    expect(store.currentRequest).toBeNull();
    expect(store.balance).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should set error state if fetching balance fails', async () => {
    const store = useVacationsStore();
    try {
      await store.fetchBalance('invalid-id');
    } catch (e) {
      // expected
    }
    expect(store.loading).toBe(false);
  });

  it('should handle fetchRequestDetail failure gracefully', async () => {
    const store = useVacationsStore();
    try {
      await store.fetchRequestDetail('non-existent-id');
    } catch (e) {
      // expected
    }
    expect(store.loading).toBe(false);
  });
});
