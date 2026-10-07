import { describe, it, expect } from 'vitest';
import { formatDate, formatHumanDate, formatDateTime, formatDateRange } from '../date.js';

describe('Date Formatting Utilities (Human-readable dates)', () => {
  it('should format ISO timestamp to human readable DD/MM/YYYY without timezone shift', () => {
    const isoDate = '1993-09-19T00:00:00.000Z';
    expect(formatDate(isoDate)).toBe('19/09/1993');
  });

  it('should format ISO timestamp to formal long format in Spanish', () => {
    const isoDate = '1993-09-19T00:00:00.000Z';
    const formatted = formatHumanDate(isoDate);
    expect(formatted).toContain('19');
    expect(formatted.toLowerCase()).toContain('septiembre');
    expect(formatted).toContain('1993');
  });

  it('should format simple YYYY-MM-DD string', () => {
    expect(formatDate('2026-10-06')).toBe('06/10/2026');
  });

  it('should format Date ranges properly', () => {
    const start = '2026-01-01T00:00:00.000Z';
    const end = '2026-12-31T00:00:00.000Z';
    expect(formatDateRange(start, end)).toBe('01/01/2026 al 31/12/2026');

    expect(formatDateRange(start, null)).toBe('01/01/2026 al Vigente');
    expect(formatDateRange(start, null, 'Indefinido')).toBe('01/01/2026 al Indefinido');
  });

  it('should handle null, undefined, empty string and fallbacks safely', () => {
    expect(formatDate(null)).toBe('No registrada');
    expect(formatDate(undefined, { fallback: 'Sin fecha' })).toBe('Sin fecha');
    expect(formatDate('')).toBe('No registrada');
    expect(formatDate('-')).toBe('No registrada');
  });

  it('should format datetime when time is included', () => {
    const dt = '2026-10-06T15:30:00';
    const res = formatDateTime(dt);
    expect(res).toContain('06/10/2026');
    expect(res).toContain('15:30');
  });
});
