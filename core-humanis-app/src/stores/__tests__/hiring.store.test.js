import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useHiringStore } from '../hiring.store.js';

describe('HiringStore Pinia State & Actions', () => {
  beforeEach(() => {
    let store = {};
    globalThis.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };
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

  it('should save draft to localStorage when saveDraft is invoked', () => {
    const store = useHiringStore();
    store.activeStep = 2;
    store.formData.persona.cui_dpi = '1984567290101';
    store.formData.persona.primer_nombre = 'Carlos';
    store.formData.persona.primer_apellido = 'Gómez';
    
    store.saveDraft();

    const saved = JSON.parse(localStorage.getItem('core_humanis_hiring_draft') || '{}');
    expect(saved.activeStep).toBe(2);
    expect(saved.formData.persona.cui_dpi).toBe('1984567290101');
    expect(saved.formData.persona.primer_nombre).toBe('Carlos');
  });

  it('should restore draft from localStorage when loadDraft is called', () => {
    const draft = {
      activeStep: 3,
      formData: {
        persona: {
          cui_dpi: '1234567890101',
          primer_nombre: 'María',
          segundo_nombre: 'Luisa',
          primer_apellido: 'López',
          segundo_apellido: '',
          correo_institucional: 'mlopez@scspr.gob.gt',
          telefono: '12345678',
          direccion: 'Zona 1, Guatemala',
          nit: '123456-7'
        },
        candidato_id: null,
        convocatoria_id: null,
        empleado: {
          codigo_empleado: 'EMP-2026-099',
          puesto_funcional_id: 'puesto-1',
          unidad_admin_id: 'unidad-1'
        },
        contrato: {
          renglon_id: '011',
          salario_mensual: '15000.00',
          fecha_inicio: '2026-10-01',
          fecha_fin: '',
          objeto_contrato: 'Servicios Profesionales',
          cerrar_contrato_anterior: false
        }
      }
    };
    localStorage.setItem('core_humanis_hiring_draft', JSON.stringify(draft));

    const store = useHiringStore();
    const loaded = store.loadDraft();

    expect(loaded).toBe(true);
    expect(store.activeStep).toBe(3);
    expect(store.formData.persona.primer_nombre).toBe('María');
    expect(store.formData.empleado.codigo_empleado).toBe('EMP-2026-099');
    expect(store.hasDraft).toBe(true);
  });

  it('should clear draft from localStorage on resetForm or clearDraft', () => {
    localStorage.setItem('core_humanis_hiring_draft', JSON.stringify({ activeStep: 2 }));
    const store = useHiringStore();
    store.clearDraft();

    expect(localStorage.getItem('core_humanis_hiring_draft')).toBeNull();
    expect(store.hasDraft).toBe(false);
  });
});

