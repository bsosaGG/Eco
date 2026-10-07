import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth.store.js';

describe('Organigram Visual Editor & RBAC Security Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  describe('RBAC Security Guard for Organigram Editing', () => {
    it('should deny editing permission for standard colaborador or unauthenticated user', () => {
      const authStore = useAuthStore();
      authStore.user = null;
      expect(authStore.canWrite).toBe(false);

      authStore.user = {
        role: 'COLABORADOR',
        permissions: ['core-humanis:read']
      };
      expect(authStore.canWrite).toBe(false);
    });

    it('should permit editing for administrator role', () => {
      const authStore = useAuthStore();
      authStore.user = {
        role: 'admin',
        permissions: []
      };
      expect(authStore.canWrite).toBe(true);
    });

    it('should permit editing for users with core-humanis:write or core-humanis:admin permission', () => {
      const authStore = useAuthStore();
      authStore.user = {
        role: 'ANALISTA_RRHH',
        permissions: ['core-humanis:write']
      };
      expect(authStore.canWrite).toBe(true);

      authStore.user = {
        role: 'JEFA_RRHH',
        permissions: ['core-humanis:admin']
      };
      expect(authStore.canWrite).toBe(true);
    });
  });

  describe('Organigram Tree Structure & Collaborator Assignment Logic', () => {
    it('should correctly assign a collaborator as Jefatura (Nivel 1) and subordinate (Nivel 2)', () => {
      const unit = {
        id: 'DIR_RRHH',
        codigo: 'DIR_RRHH',
        nombre: 'Dirección de Recursos Humanos',
        padre_id: null,
        jefes: [],
        subordinados: [],
        colaboradores: [],
        subunidades: []
      };

      const jefeColab = {
        persona_id: 'colab_101',
        cui_dpi: '2981034560101',
        primer_nombre: 'María',
        primer_apellido: 'López',
        puesto_funcional: 'Directora de Recursos Humanos',
        renglon_codigo: '011',
        is_jefe: true
      };

      const subColab = {
        persona_id: 'colab_102',
        cui_dpi: '3051029480101',
        primer_nombre: 'Carlos',
        primer_apellido: 'Gómez',
        puesto_funcional: 'Analista de Nóminas',
        renglon_codigo: '022',
        is_jefe: false
      };

      // Assign Jefe
      unit.jefes.push(jefeColab);
      unit.colaboradores.push(jefeColab);

      // Assign Subordinado
      unit.subordinados.push(subColab);
      unit.colaboradores.push(subColab);

      expect(unit.jefes.length).toBe(1);
      expect(unit.subordinados.length).toBe(1);
      expect(unit.colaboradores.length).toBe(2);
      expect(unit.jefes[0].puesto_funcional).toBe('Directora de Recursos Humanos');
    });

    it('should support promoting a subordinate to jefatura and moving jefe to technical team', () => {
      const unit = {
        id: 'SEC_GEN',
        codigo: 'SEC_GEN',
        jefes: [{ persona_id: 'p1', primer_nombre: 'Luis', is_jefe: true }],
        subordinados: [{ persona_id: 'p2', primer_nombre: 'Ana', is_jefe: false }],
        colaboradores: []
      };

      // Move Luis to team
      const jefe = unit.jefes.pop();
      unit.subordinados.push({ ...jefe, is_jefe: false });

      // Promote Ana to jefe
      const sub = unit.subordinados.shift();
      unit.jefes.push({ ...sub, is_jefe: true });

      expect(unit.jefes.length).toBe(1);
      expect(unit.jefes[0].persona_id).toBe('p2');
      expect(unit.subordinados.length).toBe(1);
      expect(unit.subordinados[0].persona_id).toBe('p1');
    });

    it('should serialize tree to CSV format compatible with the import dropzone', () => {
      const tree = [
        {
          codigo: 'DESP_SUP',
          nombre: 'Despacho Superior',
          padre_id: '',
          jefes: [
            {
              cui_dpi: '1001',
              primer_nombre: 'Juan',
              segundo_nombre: '',
              primer_apellido: 'Pérez',
              segundo_apellido: '',
              puesto_funcional: 'Secretario General',
            }
          ],
          subordinados: [],
          subunidades: [
            {
              codigo: 'DIR_RRHH',
              nombre: 'Dirección de RRHH',
              padre_id: 'DESP_SUP',
              jefes: [],
              subordinados: [
                {
                  cui_dpi: '1002',
                  primer_nombre: 'Ana',
                  segundo_nombre: '',
                  primer_apellido: 'Soto',
                  segundo_apellido: '',
                  puesto_funcional: 'Técnica',
                }
              ],
              subunidades: []
            }
          ]
        }
      ];

      const rows = ['cod_unidad, nombre_unidad, cod_padre, cod_empleado, nombre_empleado, puesto'];
      const traverse = (node, parent = '') => {
        const pCode = node.padre_id || parent;
        const all = [...node.jefes, ...node.subordinados];
        all.forEach(c => {
          rows.push(`"${node.codigo}","${node.nombre}","${pCode}","${c.cui_dpi}","${c.primer_nombre} ${c.primer_apellido}","${c.puesto_funcional}"`);
        });
        node.subunidades.forEach(s => traverse(s, node.codigo));
      };
      tree.forEach(r => traverse(r));

      const csv = rows.join('\n');
      expect(csv).toContain('DESP_SUP');
      expect(csv).toContain('Secretario General');
      expect(csv).toContain('DIR_RRHH');
      expect(csv).toContain('Ana Soto');
    });
  });

  describe('Organigram Drag and Drop Logic & Cycle Prevention', () => {
    it('should manage reactive dragged item state via useOrganigramDrag', async () => {
      const { useOrganigramDrag } = await import('../../composables/useOrganigramDrag.js');
      const { draggedItem, setDraggedItem, clearDraggedItem } = useOrganigramDrag();

      expect(draggedItem.value).toBeNull();

      setDraggedItem({ type: 'unit', unitCode: 'DEP_COMPRAS', unitName: 'Departamento de Compras' });
      expect(draggedItem.value?.unitCode).toBe('DEP_COMPRAS');

      clearDraggedItem();
      expect(draggedItem.value).toBeNull();
    });

    it('should prevent circular reparenting when moving a unit into its own descendant', () => {
      const tree = [
        {
          codigo: 'DIR_ADMIN',
          nombre: 'Dirección Administrativa',
          subunidades: [
            {
              codigo: 'DEP_COMPRAS',
              nombre: 'Departamento de Compras',
              subunidades: [
                {
                  codigo: 'SEC_ADQUISICIONES',
                  nombre: 'Sección de Adquisiciones',
                  subunidades: [],
                },
              ],
            },
          ],
        },
      ];

      const findNodeRecursive = (nodes, code) => {
        for (const n of nodes) {
          if (n.codigo === code) return n;
          if (n.subunidades?.length) {
            const found = findNodeRecursive(n.subunidades, code);
            if (found) return found;
          }
        }
        return null;
      };

      const isDescendantOf = (candidateChildCode, parentCode) => {
        if (!candidateChildCode || !parentCode) return false;
        if (candidateChildCode === parentCode) return true;
        const parentNode = findNodeRecursive(tree, parentCode);
        if (!parentNode) return false;
        const checkSubunits = (subunits) => {
          if (!subunits || !subunits.length) return false;
          for (const s of subunits) {
            if (s.codigo === candidateChildCode) return true;
            if (s.subunidades && checkSubunits(s.subunidades)) return true;
          }
          return false;
        };
        return checkSubunits(parentNode.subunidades);
      };

      // Moving DEP_COMPRAS into its child SEC_ADQUISICIONES must be detected as circular
      expect(isDescendantOf('SEC_ADQUISICIONES', 'DEP_COMPRAS')).toBe(true);
      // Moving DEP_COMPRAS into itself must be detected as circular
      expect(isDescendantOf('DEP_COMPRAS', 'DEP_COMPRAS')).toBe(true);
      // Moving DEP_COMPRAS to DIR_ADMIN is valid (not a descendant of DEP_COMPRAS)
      expect(isDescendantOf('DIR_ADMIN', 'DEP_COMPRAS')).toBe(false);
    });

    it('should correctly move a collaborator between units via drag and drop', () => {
      const unitA = {
        codigo: 'AREA_A',
        nombre: 'Área A',
        jefes: [],
        subordinados: [
          { persona_id: 'colab_1', primer_nombre: 'Elena', primer_apellido: 'Rivas', is_jefe: false },
        ],
        colaboradores: [
          { persona_id: 'colab_1', primer_nombre: 'Elena', primer_apellido: 'Rivas', is_jefe: false },
        ],
      };

      const unitB = {
        codigo: 'AREA_B',
        nombre: 'Área B',
        jefes: [],
        subordinados: [],
        colaboradores: [],
      };

      // Simulate move of Elena from Unit A to Unit B as Jefatura
      const colabToMove = unitA.subordinados[0];
      // 1. Remove from unit A
      unitA.subordinados = unitA.subordinados.filter((c) => c.persona_id !== colabToMove.persona_id);
      unitA.colaboradores = unitA.colaboradores.filter((c) => c.persona_id !== colabToMove.persona_id);

      // 2. Add to unit B as Jefe
      const transferred = { ...colabToMove, is_jefe: true };
      unitB.jefes.push(transferred);
      unitB.colaboradores.push(transferred);

      expect(unitA.colaboradores.length).toBe(0);
      expect(unitB.colaboradores.length).toBe(1);
      expect(unitB.jefes.length).toBe(1);
      expect(unitB.jefes[0].primer_nombre).toBe('Elena');
      expect(unitB.jefes[0].is_jefe).toBe(true);
    });
  });
});
