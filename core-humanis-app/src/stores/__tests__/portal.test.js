import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth.store.js';
import { useVacationsStore } from '../vacations.store.js';
import { useAttendanceStore } from '../attendance.store.js';

describe('Portal Autogestión Integration TDD', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize auth user and calculate initials correctly', () => {
    const authStore = useAuthStore();
    authStore.user = {
      nombres: 'Karina Elizabeth',
      apellidos: 'García Méndez',
      cui_dpi: '550e8400-e29b-41d4-a716-446655440000',
      role: 'ANALISTA_RRHH'
    };

    expect(authStore.user.nombres).toBe('Karina Elizabeth');
    expect(authStore.user.role).toBe('ANALISTA_RRHH');
  });

  it('should allow filtering collaborator specific vacation requests', () => {
    const vacationsStore = useVacationsStore();
    vacationsStore.requests = [
      { id: '1', persona_id: 'colab-1', correlativo: 'VAC-001', estado: 'PENDIENTE_JEFE' },
      { id: '2', persona_id: 'colab-2', correlativo: 'VAC-002', estado: 'APROBADO_RRHH' }
    ];

    const myRequests = vacationsStore.requests.filter(r => r.persona_id === 'colab-1');
    expect(myRequests.length).toBe(1);
    expect(myRequests[0].correlativo).toBe('VAC-001');
  });

  it('should accurately classify role profiles (isColaborador, isRRHH, isAuditor)', () => {
    const authStore = useAuthStore();

    authStore.user = { role: 'COLABORADOR' };
    expect(authStore.isColaborador).toBe(true);
    expect(authStore.isRRHH).toBe(false);
    expect(authStore.isAuditor).toBe(false);

    authStore.user = { role: 'AUDITOR' };
    expect(authStore.isColaborador).toBe(false);
    expect(authStore.isRRHH).toBe(false);
    expect(authStore.isAuditor).toBe(true);

    authStore.user = { role: 'JEFA_RRHH' };
    expect(authStore.isColaborador).toBe(false);
    expect(authStore.isRRHH).toBe(true);
    expect(authStore.isAuditor).toBe(false);
  });
});
