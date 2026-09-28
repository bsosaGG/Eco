import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth.store.js';
import { useComplaintsStore } from '../complaints.store.js';
import apiClient from '../../api/client.js';

describe('Auth & Complaints Stores Pinia Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('should initialize complaints store with defaults', () => {
    const complaintsStore = useComplaintsStore();
    expect(complaintsStore.complaints).toEqual([]);
    expect(complaintsStore.filters.estado).toBe('ALL');
    expect(complaintsStore.filters.tipo).toBe('ALL');
    expect(complaintsStore.pagination.page).toBe(1);
    expect(complaintsStore.pendientesCount).toBe(0);
  });

  it('should create complaint successfully and return tracking code', async () => {
    const complaintsStore = useComplaintsStore();
    const mockCreated = {
      id: 'den-123',
      correlativo: 'DEN-SCSPR-2026-0005',
      codigo_seguimiento: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      tipo_denuncia: 'ACOSO_LABORAL',
      estado: 'RECIBIDA'
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: mockCreated }
    });

    const res = await complaintsStore.createComplaint({
      tipo_denuncia: 'ACOSO_LABORAL',
      descripcion: 'Hechos denunciados'
    });

    expect(res).toBeDefined();
    expect(res.correlativo).toBe('DEN-SCSPR-2026-0005');
    expect(res.codigo_seguimiento.length).toBe(64);
  });

  it('should track complaint by tracking code', async () => {
    const complaintsStore = useComplaintsStore();
    const mockTracked = {
      correlativo: 'DEN-SCSPR-2026-0001',
      tipo_denuncia: 'ACOSO_LABORAL',
      estado: 'EN_INVESTIGACION',
      resolucion_nota: 'En trámite de audiencia'
    };

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockTracked }
    });

    const res = await complaintsStore.trackComplaint('dummy-code-123');
    expect(res).toBeDefined();
    expect(complaintsStore.trackedComplaint.estado).toBe('EN_INVESTIGACION');
    expect(complaintsStore.trackedComplaint.resolucion_nota).toBe('En trámite de audiencia');
  });

  it('should update profile in auth store and reflect changes', async () => {
    const authStore = useAuthStore();
    authStore.user = {
      id: 'user-001',
      username: 'colaborador.011',
      telefono_personal: '5551-0000',
      direccion_residencia: 'Zona 1'
    };

    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: {
        success: true,
        user: {
          id: 'user-001',
          username: 'colaborador.011',
          telefono_personal: '5551-9999',
          direccion_residencia: 'Zona 10, Guatemala'
        }
      }
    });

    await authStore.updateProfile({
      telefono_personal: '5551-9999',
      direccion_residencia: 'Zona 10, Guatemala'
    });

    expect(authStore.user.telefono_personal).toBe('5551-9999');
    expect(authStore.user.direccion_residencia).toBe('Zona 10, Guatemala');
  });

  it('should update complaint status in list', async () => {
    const complaintsStore = useComplaintsStore();
    complaintsStore.complaints = [
      { id: 'den-01', correlativo: 'DEN-01', estado: 'RECIBIDA' }
    ];

    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 'den-01', correlativo: 'DEN-01', estado: 'RESUELTA', resolucion_nota: 'Medidas adoptadas' }
      }
    });

    await complaintsStore.updateStatus('den-01', 'RESUELTA', 'Medidas adoptadas');
    expect(complaintsStore.complaints[0].estado).toBe('RESUELTA');
    expect(complaintsStore.complaints[0].resolucion_nota).toBe('Medidas adoptadas');
  });
});
