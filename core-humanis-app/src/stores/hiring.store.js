import { defineStore } from 'pinia';
import api from '../api/client';

export const useHiringStore = defineStore('hiring', {
  state: () => ({
    pipeline: [],
    loading: false,
    error: null,
    activeStep: 1, // 1: Persona, 2: Candidato, 3: Empleado, 4: Contrato
    cuiValidation: {
      validFormat: false,
      exists: false,
      message: '',
      persona: null,
      checking: false
    },
    formData: {
      persona: {
        cui_dpi: '',
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
        correo_institucional: '',
        telefono: '',
        direccion: '',
        nit: ''
      },
      candidato_id: null,
      convocatoria_id: null,
      empleado: {
        codigo_empleado: '',
        puesto_funcional_id: '',
        unidad_admin_id: ''
      },
      contrato: {
        renglon_id: '',
        salario_mensual: '',
        fecha_inicio: '',
        fecha_fin: '',
        objeto_contrato: '',
        cerrar_contrato_anterior: false
      }
    },
    successResult: null
  }),

  actions: {
    async fetchPipeline() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/hiring/pipeline');
        this.pipeline = response.data.data || [];
        return this.pipeline;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar el pipeline de contratación';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async validateCui(cui) {
      if (!cui || cui.trim().length !== 13) {
        this.cuiValidation = {
          validFormat: false,
          exists: false,
          message: 'El CUI / DPI debe tener exactamente 13 dígitos numéricos',
          persona: null,
          checking: false
        };
        return this.cuiValidation;
      }

      this.cuiValidation.checking = true;
      try {
        const response = await api.post('/hiring/validate-cui', { cui });
        this.cuiValidation = {
          validFormat: response.data.validFormat,
          exists: response.data.exists,
          message: response.data.message,
          persona: response.data.persona,
          checking: false
        };

        // Si la persona ya existe, autocompletar datos básicos para el flujo
        if (response.data.exists && response.data.persona) {
          const p = response.data.persona;
          this.formData.persona.primer_nombre = p.primer_nombre || '';
          this.formData.persona.primer_apellido = p.primer_apellido || '';
        }
        return this.cuiValidation;
      } catch (err) {
        this.cuiValidation.checking = false;
        this.cuiValidation.message = err.response?.data?.message || 'Error al validar CUI';
        throw err;
      }
    },

    selectCandidate(candidate) {
      this.formData.candidato_id = candidate.id;
      this.formData.convocatoria_id = candidate.convocatoria_id;
      this.formData.persona.cui_dpi = candidate.cui || '';
      
      const nombres = (candidate.nombres || '').split(' ');
      const apellidos = (candidate.apellidos || '').split(' ');
      this.formData.persona.primer_nombre = nombres[0] || '';
      this.formData.persona.segundo_nombre = nombres.slice(1).join(' ') || '';
      this.formData.persona.primer_apellido = apellidos[0] || '';
      this.formData.persona.segundo_apellido = apellidos.slice(1).join(' ') || '';
      this.formData.persona.correo_institucional = candidate.email || '';
      this.formData.persona.telefono = candidate.telefono || '';
      
      this.formData.contrato.salario_mensual = candidate.salario_convocatoria || '';
      this.formData.contrato.objeto_contrato = candidate.titulo_plaza || '';

      // Validar CUI automáticamente
      if (candidate.cui) {
        this.validateCui(candidate.cui).catch(() => {});
      }
      this.activeStep = 1;
    },

    async formalizeHiring() {
      this.loading = true;
      this.error = null;
      try {
        const payload = {
          cui: this.formData.persona.cui_dpi,
          primer_nombre: this.formData.persona.primer_nombre,
          segundo_nombre: this.formData.persona.segundo_nombre,
          primer_apellido: this.formData.persona.primer_apellido,
          segundo_apellido: this.formData.persona.segundo_apellido,
          email: this.formData.persona.correo_institucional,
          telefono: this.formData.persona.telefono,
          direccion_residencia: this.formData.persona.direccion,
          nit: this.formData.persona.nit,
          postulacion_id: this.formData.candidato_id,
          puesto_funcional_id: this.formData.empleado.puesto_funcional_id,
          unidad_admin_id: this.formData.empleado.unidad_admin_id,
          renglon_id: this.formData.contrato.renglon_id,
          salario_honorarios: this.formData.contrato.salario_mensual,
          fecha_inicio: this.formData.contrato.fecha_inicio,
          fecha_fin: this.formData.contrato.fecha_fin,
          partida_presupuestaria: this.formData.contrato.objeto_contrato,
          observaciones: this.formData.contrato.objeto_contrato,
          cerrar_contrato_anterior: this.formData.contrato.cerrar_contrato_anterior,
          persona: this.formData.persona,
          empleado: this.formData.empleado,
          contrato: this.formData.contrato
        };
        const response = await api.post('/hiring/formalize', payload);
        this.successResult = response.data.data || response.data;
        await this.fetchPipeline();
        return this.successResult;
      } catch (err) {
        this.error = err.response?.data?.message || err.message || 'Error al formalizar la contratación';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    resetForm() {
      this.activeStep = 1;
      this.formData = {
        persona: {
          cui_dpi: '',
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
          correo_institucional: '',
          telefono: '',
          direccion: '',
          nit: ''
        },
        candidato_id: null,
        convocatoria_id: null,
        empleado: {
          codigo_empleado: '',
          puesto_funcional_id: '',
          unidad_admin_id: ''
        },
        contrato: {
          renglon_id: '',
          salario_mensual: '',
          fecha_inicio: '',
          fecha_fin: '',
          objeto_contrato: '',
          cerrar_contrato_anterior: false
        }
      };
      this.cuiValidation = {
        validFormat: false,
        exists: false,
        message: '',
        persona: null,
        checking: false
      };
      this.successResult = null;
      this.error = null;
    }
  }
});
