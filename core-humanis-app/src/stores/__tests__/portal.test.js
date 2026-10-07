import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth.store.js';
import { useVacationsStore } from '../vacations.store.js';
import { useAttendanceStore } from '../attendance.store.js';
import { usePayrollsStore } from '../payrolls.store.js';
import apiClient from '../../api/client.js';

describe('Portal Autogestión (Self-Service) & Role Permissions - Exhaustive Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  describe('1. Role Authorization & RBAC Rules', () => {
    it('should classify COLABORADOR role correctly and deny administrative write privileges', () => {
      const authStore = useAuthStore();
      authStore.user = {
        id: 'usr-colab-01',
        role: 'COLABORADOR',
        cui_dpi: '1984567290101',
        permissions: []
      };

      expect(authStore.isColaborador).toBe(true);
      expect(authStore.isRRHH).toBe(false);
      expect(authStore.isAuditor).toBe(false);
      expect(authStore.canWrite).toBe(false);
      expect(authStore.canIssueConstancias).toBe(false);
      expect(authStore.hasPermission('core-humanis:write')).toBe(false);
    });

    it('should classify ANALISTA_RRHH and JEFA_RRHH with full administrative capabilities', () => {
      const authStore = useAuthStore();
      
      authStore.user = { role: 'ANALISTA_RRHH', permissions: ['core-humanis:write', 'core-humanis:read'] };
      expect(authStore.isColaborador).toBe(false);
      expect(authStore.isRRHH).toBe(true);
      expect(authStore.canWrite).toBe(true);
      expect(authStore.hasPermission('core-humanis:write')).toBe(true);

      authStore.user = { role: 'JEFA_RRHH', permissions: ['core-humanis:admin', 'core-humanis:constancias'] };
      expect(authStore.isRRHH).toBe(true);
      expect(authStore.canWrite).toBe(true);
      expect(authStore.canIssueConstancias).toBe(true);
      expect(authStore.hasPermission('core-humanis:constancias')).toBe(true);
    });

    it('should grant full access to system admin', () => {
      const authStore = useAuthStore();
      authStore.user = { role: 'admin', permissions: [] };

      expect(authStore.canWrite).toBe(true);
      expect(authStore.canIssueConstancias).toBe(true);
      expect(authStore.hasPermission('any:custom:permission')).toBe(true);
    });
  });

  describe('2. Decoupled Auth and Dynamic Employee Binding via /portal/profile', () => {
    it('should fetch user session from auth and dynamically bind collaborator dossier from RRHH', async () => {
      const authStore = useAuthStore();
      authStore.token = 'mock-jwt-token';

      // 1. Respuesta de autenticación (/auth/me): solo sesión, roles y permisos (cero datos de personas)
      const mockAuthMeResponse = {
        data: {
          success: true,
          user: {
            id: 'usr-colab-99',
            username: 'colaborador.scspr',
            email: 'empleado@scspr.gob.gt',
            role: 'COLABORADOR',
            rol_nombre: 'Colaborador Institucional (Self-Service)',
            permissions: ['core-humanis:read']
          }
        }
      };

      // 2. Respuesta de RRHH (/portal/profile): expediente laboral del colaborador (personas)
      const mockPortalProfileResponse = {
        data: {
          success: true,
          profile: {
            nombres: 'Harold Rolando',
            apellidos: 'Sánchez Pérez',
            cui_dpi: '1984567290101',
            persona_id: 'pers-uuid-001',
            puesto_funcional: 'Analista de Sistemas',
            unidad_admin: 'Dirección de Informática',
            renglon_codigo: '011'
          }
        }
      };

      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockAuthMeResponse)
        .mockResolvedValueOnce(mockPortalProfileResponse);

      await authStore.initAuth();

      expect(authStore.user).toBeDefined();
      expect(authStore.user.id).toBe('usr-colab-99');
      expect(authStore.user.persona_id).toBe('pers-uuid-001');
      expect(authStore.user.cui_dpi).toBe('1984567290101');
      expect(authStore.user.puesto_funcional).toBe('Analista de Sistemas');
      expect(authStore.isColaborador).toBe(true);
    });
  });

  describe('3. Portal Screen Actions & API Integration', () => {
    it('should fetch collaborator vacation balance and filter individual requests', async () => {
      const vacationsStore = useVacationsStore();
      
      const mockBalance = {
        persona_id: 'pers-uuid-001',
        dias_derecho_anual: 15,
        dias_acumulados: 15,
        dias_utilizados: 3,
        dias_disponibles: 12
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: { success: true, data: mockBalance } });

      const balance = await vacationsStore.fetchBalance('pers-uuid-001');
      expect(balance.dias_disponibles).toBe(12);
      expect(vacationsStore.balance.dias_acumulados).toBe(15);
    });

    it('should create a vacation request from Portal Self-Service option', async () => {
      const vacationsStore = useVacationsStore();

      const newRequestPayload = {
        persona_id: 'pers-uuid-001',
        tipo_licencia_id: 'vac-ordinaria',
        fecha_inicio: '2026-10-10',
        fecha_fin: '2026-10-15',
        dias_solicitados: 5,
        observaciones: 'Vacaciones de fin de año'
      };

      const mockResponseData = {
        id: 'req-001',
        correlativo: 'VAC-2026-0042',
        estado: 'PENDIENTE_JEFE',
        ...newRequestPayload
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true, data: mockResponseData } });
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: { success: true, data: [mockResponseData] } });

      const created = await vacationsStore.createRequest(newRequestPayload);
      expect(created.correlativo).toBe('VAC-2026-0042');
      expect(created.estado).toBe('PENDIENTE_JEFE');
    });

    it('should register biometric punches and fetch punch history in attendance screen', async () => {
      const attendanceStore = useAttendanceStore();

      const punchPayload = {
        persona_id: 'pers-uuid-001',
        tipo: 'ENTRADA',
        fecha_hora: '2026-10-06T08:00:00Z',
        origen: 'PORTAL_WEB'
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, message: 'Marca registrada exitosamente' }
      });

      const res = await attendanceStore.registerPunches(punchPayload);
      expect(res.success).toBe(true);

      const mockPunches = [
        { id: 'p-1', tipo: 'ENTRADA', fecha_hora: '2026-10-06T08:00:00Z' },
        { id: 'p-2', tipo: 'SALIDA', fecha_hora: '2026-10-06T17:00:00Z' }
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: { success: true, data: mockPunches } });

      const punches = await attendanceStore.fetchPunches('pers-uuid-001');
      expect(punches.length).toBe(2);
      expect(punches[0].tipo).toBe('ENTRADA');
    });

    it('should fetch collaborator payroll slips in Self-Service portal', async () => {
      const payrollsStore = usePayrollsStore();

      const mockSlips = [
        {
          id: 'slip-001',
          periodo: '2026-09',
          salario_devengado: 12000.00,
          total_descuentos: 1500.00,
          liquido_recibir: 10500.00,
          hash_verificacion: 'abc123hash'
        }
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: { success: true, data: mockSlips } });

      const slips = await payrollsStore.fetchMySlips();
      expect(slips.length).toBe(1);
      expect(slips[0].liquido_recibir).toBe(10500.00);
      expect(slips[0].hash_verificacion).toBe('abc123hash');
    });
  });
});

