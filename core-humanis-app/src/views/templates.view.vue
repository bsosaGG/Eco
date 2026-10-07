<template>
  <div class="templates-view page-container">
    <!-- Header Institucional -->
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Gestor de Plantillas de Documentos Modificables</h2>
          <p class="text-muted templates-header__desc">
            Motor de impresión dinámico basado en plantillas <strong>DOCX oficiales</strong> con conversión automática a PDF y código QR institucional.
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--outline" @click="showGuideModal = true">
            <span class="icon-inline">ℹ️</span> ¿Cómo modificar textos?
          </button>
        </div>
      </div>
    </div>

    <!-- Alert de confirmación o error -->
    <div v-if="templatesStore.successMessage" class="alert alert--success mb-4">
      {{ templatesStore.successMessage }}
    </div>
    <div v-if="templatesStore.error" class="alert alert--danger mb-4">
      {{ templatesStore.error }}
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="card mb-4 filter-bar-card">
      <div class="card__body filter-bar-body">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="form-control search-input" 
            placeholder="Buscar por nombre, código o descripción de plantilla..."
          />
          <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">✕</button>
        </div>

        <div class="category-pills">
          <button 
            v-for="cat in categories" 
            :key="cat.id" 
            class="pill-btn" 
            :class="{ 'pill-btn--active': selectedCategory === cat.id }"
            @click="selectedCategory = cat.id"
          >
            {{ cat.label }} ({{ getCategoryCount(cat.id) }})
          </button>
        </div>
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="templatesStore.loading && templatesStore.templates.length === 0" class="loading-state card">
      <div class="card__body text-center py-5">
        <div class="spinner mb-3"></div>
        <p class="text-muted">Cargando catálogo oficial de documentos institucionales...</p>
      </div>
    </div>

    <!-- Estado Vacío -->
    <div v-else-if="filteredTemplates.length === 0" class="empty-state card">
      <div class="card__body text-center py-5">
        <div class="empty-state__icon">📄</div>
        <h3>No se encontraron plantillas</h3>
        <p class="text-muted">No existen documentos que coincidan con el filtro o término de búsqueda ingresado.</p>
        <button class="btn btn--secondary mt-3" @click="resetFilters">
          Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Lista de Plantillas Institucionales -->
    <div v-else class="templates-grid">
      <div 
        v-for="tpl in filteredTemplates" 
        :key="tpl.codigo" 
        class="card template-card"
      >
        <div class="card__header template-card__header">
          <div>
            <span class="badge" :class="getTypeBadge(tpl.tipo)">{{ formatType(tpl.tipo) }}</span>
            <h4 class="template-card__title">{{ tpl.nombre }}</h4>
          </div>
          <span class="text-muted font-mono text-xs template-code-badge">{{ tpl.codigo }}</span>
        </div>

        <div class="card__body">
          <p class="template-card__desc">{{ tpl.descripcion }}</p>
          
          <div class="template-card__meta">
            <span class="meta-label">Archivo base:</span>
            <code class="font-mono text-xs meta-filename">📁 {{ tpl.archivo_nombre }}</code>
          </div>

          <!-- Variables Disponibles Accordion -->
          <div class="template-vars">
            <button 
              class="template-vars__toggle" 
              @click="toggleVars(tpl.codigo)"
            >
              <span>
                <strong>Comodines de texto</strong> ({{ tpl.variables_disponibles?.length || 0 }} disponibles)
              </span>
              <span class="toggle-arrow">{{ expandedTpl === tpl.codigo ? '▲ Ocultar' : '▼ Ver comodines' }}</span>
            </button>
            
            <div v-if="expandedTpl === tpl.codigo" class="template-vars__content">
              <p class="vars-help-text">Haz clic sobre cualquier comodín para copiarlo y pegarlo en el archivo Word:</p>
              <div 
                v-for="v in tpl.variables_disponibles" 
                :key="v.tag" 
                class="var-chip"
                @click="copyTag(v.tag)"
                title="Clic para copiar comodín al portapapeles"
              >
                <code class="var-chip__tag">{&#123;{{ v.tag }}&#125;}</code>
                <span class="var-chip__desc">{{ v.descripcion }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones Principales -->
        <div class="card__footer template-card__footer">
          <div class="footer-actions-left">
            <button 
              class="btn btn--sm btn--ghost"
              @click="openEditModal(tpl)"
              title="Editar título o descripción institucional de esta plantilla"
            >
              ✏️ Editar Datos
            </button>
          </div>

          <div class="footer-actions-right">
            <button 
              class="btn btn--sm btn--outline" 
              :disabled="actionInProgress(tpl.codigo)"
              @click="handleDownload(tpl.codigo)"
              title="Descargar plantilla .docx para modificar textos en Microsoft Word o LibreOffice"
            >
              <span v-if="downloadingCode === tpl.codigo" class="btn-spinner"></span>
              {{ downloadingCode === tpl.codigo ? 'Descargando...' : '📥 Descargar DOCX' }}
            </button>
            
            <label 
              class="btn btn--sm btn--secondary btn-upload" 
              :class="{ 'btn--disabled': actionInProgress(tpl.codigo) }"
              title="Subir el archivo .docx con los textos modificados"
            >
              <span v-if="uploadingCode === tpl.codigo" class="btn-spinner"></span>
              {{ uploadingCode === tpl.codigo ? 'Subiendo...' : '📤 Reemplazar DOCX' }}
              <input 
                type="file" 
                accept=".docx" 
                class="hidden-file-input" 
                :disabled="actionInProgress(tpl.codigo)"
                @change="handleFileUpload($event, tpl.codigo)" 
              />
            </label>

            <button 
              class="btn btn--sm btn--primary" 
              :disabled="actionInProgress(tpl.codigo)"
              @click="handleTestRender(tpl.codigo)"
              title="Generar vista previa en PDF con datos modelo para validar cambios de texto"
            >
              <span v-if="renderingCode === tpl.codigo" class="btn-spinner"></span>
              {{ renderingCode === tpl.codigo ? 'Generando PDF...' : '🖨️ Probar PDF' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 1: ¿CÓMO MODIFICAR TEXTOS EN LAS PLANTILLAS? -->
    <div v-if="showGuideModal" class="modal-overlay" @click.self="showGuideModal = false">
      <div class="modal-card">
        <div class="modal-card__header">
          <h3>Guía para Modificar Textos de las Plantillas</h3>
          <button class="close-btn" @click="showGuideModal = false">✕</button>
        </div>
        <div class="modal-card__body">
          <div class="guide-steps">
            <div class="guide-step">
              <div class="guide-step__num">1</div>
              <div class="guide-step__content">
                <h4>Descargar la plantilla oficial</h4>
                <p>Haz clic en el botón <strong>"📥 Descargar DOCX"</strong> de la plantilla que deseas cambiar. Se descargará el archivo oficial en formato Microsoft Word.</p>
              </div>
            </div>

            <div class="guide-step">
              <div class="guide-step__num">2</div>
              <div class="guide-step__content">
                <h4>Editar los textos en Word o LibreOffice</h4>
                <p>Abre el archivo descargado. Puedes modificar libremente párrafos fijos, encabezados, pies de página o cláusulas legales según las instrucciones institucionales.</p>
              </div>
            </div>

            <div class="guide-step">
              <div class="guide-step__num">3</div>
              <div class="guide-step__content">
                <h4>Mantener o posicionar los comodines dinámicos</h4>
                <p>Para los datos que la plataforma llena automáticamente (nombres, DPI, fechas, montos, firmas o código QR), asegúrate de utilizar los comodines entre llaves exactos, por ejemplo: <code>{&#123;colaborador_nombre&#125;}</code> o <code>{&#123;qr_code&#125;}</code>.</p>
              </div>
            </div>

            <div class="guide-step">
              <div class="guide-step__num">4</div>
              <div class="guide-step__content">
                <h4>Subir la nueva versión con "Reemplazar DOCX"</h4>
                <p>Usa el botón <strong>"📤 Reemplazar DOCX"</strong> en la tarjeta correspondiente. El sistema actualizará el repositorio de plantillas de inmediato.</p>
              </div>
            </div>

            <div class="guide-step">
              <div class="guide-step__num">5</div>
              <div class="guide-step__content">
                <h4>Validar el resultado con "Probar PDF"</h4>
                <p>Presiona <strong>"🖨️ Probar PDF"</strong> para generar un documento de prueba renderizado con datos modelo y verificar que la diagramación y textos se visualicen perfectamente.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-card__footer text-right">
          <button class="btn btn--primary" @click="showGuideModal = false">Entendido</button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: EDITAR DATOS / METADATOS DE LA PLANTILLA -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-card modal-card--edit">
        <div class="modal-card__header">
          <h3>Editar Información de Plantilla: <span class="font-mono text-primary">{{ editForm.codigo }}</span></h3>
          <button class="close-btn" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-card__body">
          <div class="form-group mb-3">
            <label class="form-label">Nombre Institucional de la Plantilla:</label>
            <input v-model="editForm.nombre" type="text" class="form-control" />
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Categoría / Tipo:</label>
            <select v-model="editForm.tipo" class="form-control">
              <option value="INFORMES_029">Informes de Actividades 029 / Subgrupo 18</option>
              <option value="CONSTANCIA">Constancias Laborales y de Servicios</option>
              <option value="CONTRATO">Contratos Administrativos</option>
              <option value="LEGAL_029">Documentos Legales (Finiquitos / Declaraciones)</option>
              <option value="HORAS_EXTRAS">Horas Extras y Asignación de Turnos</option>
              <option value="VACACIONES">Control de Vacaciones y Permisos</option>
              <option value="INDUCCION">Inducción y Código de Ética</option>
              <option value="ACCIONES_PUESTO">Acciones de Puesto y Nombramientos</option>
            </select>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Descripción Operativa y Normativa:</label>
            <textarea v-model="editForm.descripcion" rows="3" class="form-control"></textarea>
          </div>
        </div>
        <div class="modal-card__footer text-right">
          <button class="btn btn--outline mr-2" @click="showEditModal = false">Cancelar</button>
          <button class="btn btn--primary" :disabled="savingEdit" @click="saveTemplateEdit">
            {{ savingEdit ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTemplatesStore } from '../stores/templates.store';
import { useToast } from '../composables/useToast';
import { useDialog } from '../composables/useDialog';

const templatesStore = useTemplatesStore();
const toast = useToast();
const dialog = useDialog();

const searchQuery = ref('');
const selectedCategory = ref('ALL');
const expandedTpl = ref(null);
const showGuideModal = ref(false);
const showEditModal = ref(false);
const savingEdit = ref(false);

const renderingCode = ref(null);
const downloadingCode = ref(null);
const uploadingCode = ref(null);

const actionInProgress = (code) => {
  return renderingCode.value === code || downloadingCode.value === code || uploadingCode.value === code;
};

const editForm = ref({
  codigo: '',
  nombre: '',
  tipo: '',
  descripcion: ''
});

const categories = [
  { id: 'ALL', label: 'Todas las Plantillas' },
  { id: 'INFORMES_029', label: 'Informes 029 & SG18' },
  { id: 'CONSTANCIA', label: 'Constancias con QR' },
  { id: 'CONTRATO', label: 'Contratos' },
  { id: 'LEGAL_029', label: 'Legal & Finiquitos' },
  { id: 'HORAS_EXTRAS', label: 'Horas Extras' },
  { id: 'VACACIONES', label: 'Vacaciones' },
  { id: 'INDUCCION', label: 'Ética & Inducción' },
  { id: 'ACCIONES_PUESTO', label: 'Acciones de Puesto' }
];

onMounted(async () => {
  await templatesStore.fetchTemplates();
});

const filteredTemplates = computed(() => {
  let list = templatesStore.templates || [];

  if (selectedCategory.value !== 'ALL') {
    list = list.filter(t => t.tipo === selectedCategory.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(t => 
      t.nombre?.toLowerCase().includes(q) ||
      t.codigo?.toLowerCase().includes(q) ||
      t.descripcion?.toLowerCase().includes(q) ||
      t.archivo_nombre?.toLowerCase().includes(q)
    );
  }

  return list;
});

const getCategoryCount = (catId) => {
  if (catId === 'ALL') return templatesStore.templates?.length || 0;
  return templatesStore.templates?.filter(t => t.tipo === catId).length || 0;
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = 'ALL';
};

const getTypeBadge = (tipo) => {
  const map = {
    INFORMES_029: 'badge--info',
    CONSTANCIA: 'badge--success',
    CONTRATO: 'badge--warning',
    LEGAL_029: 'badge--danger',
    HORAS_EXTRAS: 'badge--primary',
    VACACIONES: 'badge--info',
    INDUCCION: 'badge--neutral',
    ACCIONES_PUESTO: 'badge--warning'
  };
  return map[tipo] || 'badge--neutral';
};

const formatType = (tipo) => {
  const map = {
    INFORMES_029: '029 / Subgrupo 18',
    CONSTANCIA: 'Constancia Oficial',
    CONTRATO: 'Contrato',
    LEGAL_029: 'Documento Legal',
    HORAS_EXTRAS: 'Horas Extras',
    VACACIONES: 'Vacaciones',
    INDUCCION: 'Inducción & Ética',
    ACCIONES_PUESTO: 'Acción de Puesto'
  };
  return map[tipo] || tipo;
};

const toggleVars = (code) => {
  expandedTpl.value = expandedTpl.value === code ? null : code;
};

const copyTag = (tag) => {
  navigator.clipboard.writeText(`{{${tag}}}`);
  toast.info(`Comodín {{${tag}}} copiado al portapapeles`);
};

const openEditModal = (tpl) => {
  editForm.value = {
    codigo: tpl.codigo,
    nombre: tpl.nombre,
    tipo: tpl.tipo,
    descripcion: tpl.descripcion
  };
  showEditModal.value = true;
};

const saveTemplateEdit = async () => {
  savingEdit.value = true;
  try {
    await templatesStore.updateTemplate(editForm.value.codigo, {
      nombre: editForm.value.nombre,
      tipo: editForm.value.tipo,
      descripcion: editForm.value.descripcion
    });
    toast.success('Información de la plantilla actualizada correctamente');
    showEditModal.value = false;
  } catch (err) {
    toast.error(err.message || 'Error al guardar los cambios');
  } finally {
    savingEdit.value = false;
  }
};

const handleDownload = async (code) => {
  if (actionInProgress(code)) return;
  downloadingCode.value = code;
  try {
    toast.info(`Descargando plantilla ${code}.docx...`);
    await templatesStore.downloadDocx(code);
  } catch (err) {
    toast.error(err.message || 'Error al descargar la plantilla');
  } finally {
    downloadingCode.value = null;
  }
};

const handleFileUpload = async (event, code) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.name.endsWith('.docx')) {
    toast.error('Únicamente se permiten archivos con extensión .docx');
    event.target.value = '';
    return;
  }

  const ok = await dialog.confirm({
    title: `Reemplazar plantilla ${code}`,
    message: `¿Confirma reemplazar la plantilla oficial <strong>${code}</strong> con el archivo <em>"${file.name}"</em>?<br><span style="font-size:0.85rem">Los nuevos textos y formatos se aplicarán de inmediato a todas las impresiones.</span>`,
    variant: 'warning',
    confirmLabel: 'Sí, reemplazar',
    cancelLabel: 'Cancelar',
  });
  if (ok) {
    uploadingCode.value = code;
    try {
      toast.info('Subiendo nueva plantilla...');
      await templatesStore.uploadDocx(code, file);
      toast.success('Plantilla actualizada exitosamente en el sistema.');
    } catch (err) {
      toast.error(err.message || 'Error al actualizar la plantilla');
    } finally {
      uploadingCode.value = null;
    }
  }
  event.target.value = '';
};

const handleTestRender = async (code) => {
  if (actionInProgress(code)) return;
  renderingCode.value = code;
  try {
    toast.info(`Generando PDF de prueba para ${code}...`);
    await templatesStore.renderTemplate(code, 'pdf', {
      colaborador_nombre: 'Licda. Karina Elizabeth García Méndez',
      contratista_nombre: 'Licda. Karina Elizabeth García Méndez',
      cui_dpi: '1984 56729 0101',
      nit: '7845129-3',
      puesto_funcional: 'Directora de Recursos Humanos',
      unidad_administrativa: 'Unidad de Recursos Humanos',
      unidad_solicitante: 'Unidad de Recursos Humanos',
      numero_acta: 'SCSPR-URH-ACTA-2026-0042',
      numero_contrato: 'SCSP-029-045-2026',
      numero_oficio: 'OF-URH-2026-089',
      fecha_oficio: '02/10/2026',
      fecha_solicitud: '2026-10-02',
      fecha_emision: '2 de Octubre de 2026',
      fecha_ingreso: '01 de Enero de 2024',
      fecha_firma: '02/10/2026',
      fecha_posesion: '02 de Octubre de 2026',
      fecha_entrega: '02 de Octubre de 2026',
      fecha_inicio: '2026-10-05',
      fecha_fin: '2026-10-09',
      dias_solicitados: '5',
      saldo_previo: '15',
      saldo_remanente: '10',
      salario_letras: 'Doce mil quetzales exactos',
      salario_numero: '12,000.00',
      salario_base: 'Q. 12,000.00',
      bonificacion_incentivo: 'Q. 250.00',
      honorarios_letras: 'Diez mil quetzales exactos',
      honorarios_numero: '10,000.00',
      honorarios_mensuales: 'Q. 10,000.00',
      honorarios_monto: '10,000.00',
      monto_total_pagado: 'Q. 120,000.00',
      plazo_meses: '12',
      vigencia_contrato: 'Del 01 de enero al 31 de diciembre de 2026',
      vigencia_inicio: '01/01/2026',
      vigencia_fin: '31/12/2026',
      objeto_servicios: 'Servicios profesionales de asesoría en gestión y dirección del talento humano',
      objeto_contrato: 'Servicios profesionales de asesoría en gestión y dirección del talento humano',
      resumen_actividades: 'Ejecución y seguimiento de las metas institucionales de recursos humanos',
      productos_entregados: 'Informes de avance, matrices de seguimiento y evaluaciones',
      atribuciones_detalle: '1. Coordinación de procesos de selección. 2. Administración de nóminas.',
      motivo: 'Descanso vacacional ordinario anual reglamentario',
      motivo_entrega: 'Promoción y traslado administrativo',
      motivo_extraordinario: 'Cobertura de eventos presidenciales de urgencia',
      cantidad_horas: '20 horas extraordinarias',
      personal_asignado: 'Equipo de guardia y monitoreo institucional',
      correlativo: 'SCSPR-TEST-2026-001',
      supervisor_nombre: 'Lic. Héctor Paz - Subsecretario de Comunicación Social',
      autoridad_nombre: 'Secretario de Comunicación Social de la Presidencia',
      notario_nombre: 'Lic. Carlos René Morales - Notario Institucional',
      fecha_acta: '02 de Octubre de 2026',
      domicilio: 'Ciudad de Guatemala, Guatemala',
      hash_verificacion: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      dirigido_a: 'A QUIEN INTERESE'
    });
    toast.success('PDF de prueba generado con éxito');
  } catch (err) {
    toast.error(err.message || 'Error al previsualizar la plantilla');
  } finally {
    renderingCode.value = null;
  }
};
</script>

<style scoped>
.templates-header__desc {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.filter-bar-card {
  background: #ffffff;
  border: 1px solid var(--color-border-light, #e2e8f0);
}

.filter-bar-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 0.9rem;
  color: var(--color-text-muted, #94a3b8);
}

.search-input {
  width: 100%;
  padding-left: 2.25rem;
  padding-right: 2rem;
  height: 42px;
  border-radius: 8px;
  border: 1px solid var(--color-border-light, #cbd5e1);
  font-size: 0.95rem;
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.9rem;
}

.category-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pill-btn {
  background: var(--color-bg-alt, #f1f5f9);
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.825rem;
  font-weight: 500;
  color: var(--color-text-secondary, #475569);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill-btn:hover {
  background: #e2e8f0;
}

.pill-btn--active {
  background: var(--color-primary, #0c2340);
  color: #ffffff;
  border-color: var(--color-primary, #0c2340);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr));
  gap: 1.25rem;
}

.template-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.template-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 0.5rem;
}

.template-card__title {
  margin: 0.35rem 0 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-institucional, #0c2340);
  line-height: 1.35;
}

.template-code-badge {
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.725rem;
  white-space: nowrap;
}

.template-card__desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #475569);
  margin-bottom: 0.75rem;
  line-height: 1.45;
}

.template-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-alt, #f8fafc);
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  border: 1px solid #f1f5f9;
}

.meta-label {
  font-size: 0.75rem;
  color: #64748b;
}

.meta-filename {
  font-size: 0.75rem;
  color: #0369a1;
}

.template-vars {
  border-top: 1px dashed #e2e8f0;
  padding-top: 0.5rem;
}

.template-vars__toggle {
  background: none;
  border: none;
  color: var(--color-primary, #0c2340);
  font-size: 0.825rem;
  cursor: pointer;
  padding: 6px 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.toggle-arrow {
  color: #0284c7;
  font-size: 0.775rem;
}

.template-vars__content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 180px;
  overflow-y: auto;
  margin-top: 6px;
  padding: 8px;
  background: var(--color-bg-alt, #f8fafc);
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.vars-help-text {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 4px;
}

.var-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 0.775rem;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  transition: all 0.15s ease;
}

.var-chip:hover {
  background: #f0fdf4;
  border-color: #86efac;
}

.var-chip__tag {
  color: #c5a059;
  font-weight: 700;
  background: #fefce8;
  padding: 2px 4px;
  border-radius: 3px;
}

.var-chip__desc {
  color: #64748b;
  font-size: 0.75rem;
  text-align: right;
}

.template-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.85rem;
}

.footer-actions-left {
  display: flex;
  gap: 6px;
}

.footer-actions-right {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-upload {
  position: relative;
  cursor: pointer;
}

.hidden-file-input {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.btn--ghost {
  background: none;
  border: 1px solid transparent;
  color: #475569;
  cursor: pointer;
}

.btn--ghost:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* Modales */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(12, 35, 64, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 620px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-card__header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--color-primary, #0c2340);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #64748b;
  cursor: pointer;
}

.modal-card__body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-card__footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.guide-step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.guide-step__num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary, #0c2340);
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  flex-shrink: 0;
}

.guide-step__content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #0f172a;
}

.guide-step__content p {
  margin: 0;
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.45;
}

.guide-step__content code {
  background: #f1f5f9;
  padding: 2px 5px;
  border-radius: 4px;
  color: #0369a1;
}

.alert {
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.alert--success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert--danger {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid var(--color-primary, #0c2340);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

.btn-spinner {
  display: inline-block;
  width: 0.85rem;
  height: 0.85rem;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.35rem;
  vertical-align: middle;
}

.btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
