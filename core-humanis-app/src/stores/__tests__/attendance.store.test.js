import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAttendanceStore } from '../attendance.store.js';

describe('AttendanceStore Pinia State & Biometrics', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty state', () => {
    const store = useAttendanceStore();
    expect(store.punches).toEqual([]);
    expect(store.incidents).toEqual([]);
    expect(store.loading).toBe(false);
  });
});
