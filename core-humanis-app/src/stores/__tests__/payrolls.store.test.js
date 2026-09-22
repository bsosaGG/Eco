import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePayrollsStore } from "../payrolls.store.js";

describe("PayrollsStore Pinia State (Ola 3)", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should initialize with default empty state", () => {
    const store = usePayrollsStore();
    expect(store.payrolls).toEqual([]);
    expect(store.currentPayroll).toBeNull();
    expect(store.personnelActions).toEqual([]);
    expect(store.disciplinaryRecords).toEqual([]);
    expect(store.mySlips).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.pagination.page).toBe(1);
  });
});
