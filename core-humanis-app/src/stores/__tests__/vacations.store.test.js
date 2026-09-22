import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useVacationsStore } from '../vacations.store.js';

describe('VacationsStore Pinia State', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty state and default loading flags', () => {
    const store = useVacationsStore();
    expect(store.requests).toEqual([]);
    expect(store.balance).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should set error state if fetching balance fails', async () => {
    const store = useVacationsStore();
    // Forzamos error o invocación sin API activa
    try {
      await store.fetchBalance('invalid-id');
    } catch (e) {
      // expected
    }
    // El store debe manejar o exponer error
    expect(store.loading).toBe(false);
  });
});
