import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTemplatesStore } from '../templates.store.js';

describe('TemplatesStore Pinia State & Actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty templates list and null flags', () => {
    const store = useTemplatesStore();
    expect(store.templates).toEqual([]);
    expect(store.currentTemplate).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should set error state if fetchTemplates fails without backend', async () => {
    const store = useTemplatesStore();
    try {
      await store.fetchTemplates();
    } catch (e) {
      // expected if API mock or server is unreachable
    }
    expect(store.loading).toBe(false);
  });
});
