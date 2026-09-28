import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useHiringStore } from '../hiring.store.js';

describe('HiringStore Pinia State & Actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with 4-step wizard defaults and empty pipeline', () => {
    const store = useHiringStore();
    expect(store.pipeline).toEqual([]);
    expect(store.activeStep).toBe(1);
    expect(store.formData.persona.cui_dpi).toBe('');
    expect(store.formData.contrato.cerrar_contrato_anterior).toBe(false);
    expect(store.cuiValidation.validFormat).toBe(false);
  });

  it('should reject invalid CUI format client-side (< 13 digits)', async () => {
    const store = useHiringStore();
    const result = await store.validateCui('12345');
    expect(result.validFormat).toBe(false);
    expect(result.message).toContain('13 dígitos');
  });

  it('should populate formData when selectCandidate is called', () => {
    const store = useHiringStore();
    const candidate = {
      id: 'cand-001',
      convocatoria_id: 'conv-001',
      cui: '1984567290101',
      nombres: 'Harold Rolando',
      apellidos: 'Sánchez Pérez',
      email: 'harold@scspr.gob.gt',
      telefono: '55551234',
      salario_convocatoria: '18000.00',
      titulo_plaza: 'Analista de Monitoreo'
    };

    store.selectCandidate(candidate);

    expect(store.formData.candidato_id).toBe('cand-001');
    expect(store.formData.persona.cui_dpi).toBe('1984567290101');
    expect(store.formData.persona.primer_nombre).toBe('Harold');
    expect(store.formData.persona.primer_apellido).toBe('Sánchez');
    expect(store.formData.contrato.salario_mensual).toBe('18000.00');
    expect(store.formData.contrato.objeto_contrato).toBe('Analista de Monitoreo');
    expect(store.activeStep).toBe(1);
  });

  it('should reset form back to initial state', () => {
    const store = useHiringStore();
    store.activeStep = 3;
    store.formData.persona.cui_dpi = '1234567890101';
    store.resetForm();

    expect(store.activeStep).toBe(1);
    expect(store.formData.persona.cui_dpi).toBe('');
    expect(store.formData.candidato_id).toBeNull();
  });
});
