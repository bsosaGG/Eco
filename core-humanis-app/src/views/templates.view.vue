<template>
  <div class="templates-view">
    <!-- Header -->
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Gestor de Plantillas de Documentos</h2>
          <p class="text-muted templates-header__desc">
            Motor de impresión dinámico basado en plantillas <strong>DOCX modificables</strong> (easy-template-x) 
            con conversión automática a PDF (LibreOffice).
          </p>
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

    <!-- Lista de Plantillas Institucionales -->
    <div class="templates-grid">
      <div 
        v-for="tpl in templatesStore.templates" 
        :key="tpl.id" 
        class="card template-card"
      >
        <div class="card__header template-card__header">
          <div>
            <span class="badge" :class="getTypeBadge(tpl.tipo)">{{ tpl.tipo }}</span>
            <h4 class="template-card__title">{{ tpl.nombre }}</h4>
          </div>
          <span class="text-muted font-mono text-xs">{{ tpl.codigo }}</span>
        </div>

        <div class="card__body">
          <p class="template-card__desc">{{ tpl.descripcion }}</p>
          <div class="template-card__meta">
            <span class="text-muted text-xs">Archivo base:</span>
            <code class="font-mono text-xs">{{ tpl.archivo_nombre }}</code>
          </div>

          <!-- Variables Disponibles Accordion -->
          <div class="template-vars">
            <button 
              class="template-vars__toggle" 
              @click="toggleVars(tpl.codigo)"
            >
              <span>Variables disponibles ({{ tpl.variables_disponibles?.length || 0 }})</span>
              <span>{{ expandedTpl === tpl.codigo ? '▲' : '▼' }}</span>
            </button>
            <div v-if="expandedTpl === tpl.codigo" class="template-vars__content">
              <div 
                v-for="v in tpl.variables_disponibles" 
                :key="v.tag" 
                class="var-chip"
                @click="copyTag(v.tag)"
                title="Clic para copiar tag"
              >
                <code class="var-chip__tag">{&#123;{{ v.tag }}&#125;}</code>
                <span class="var-chip__desc">{{ v.descripcion }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones: Descargar DOCX, Subir DOCX, Previsualizar PDF -->
        <div class="card__footer template-card__footer">
          <button 
            class="btn btn--sm btn--outline" 
            @click="handleDownload(tpl.codigo)"
            title="Descargar plantilla .docx para editar en Word"
          >
            📥 Descargar DOCX
          </button>
          
          <label class="btn btn--sm btn--secondary btn-upload">
            📤 Reemplazar DOCX
            <input 
              type="file" 
              accept=".docx" 
              class="hidden-file-input" 
              @change="handleFileUpload($event, tpl.codigo)" 
            />
          </label>

          <button 
            class="btn btn--sm btn--primary" 
            @click="handleTestRender(tpl.codigo)"
            title="Generar PDF de prueba con datos modelo"
          >
            🖨️ Probar PDF
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTemplatesStore } from '../stores/templates.store';

const templatesStore = useTemplatesStore();
const expandedTpl = ref(null);

onMounted(async () => {
  await templatesStore.fetchTemplates();
});

const getTypeBadge = (tipo) => {
  const map = {
    VACACIONES: 'badge--info',
    CONSTANCIA: 'badge--success',
    CONTRATO: 'badge--warning'
  };
  return map[tipo] || 'badge--neutral';
};

const toggleVars = (code) => {
  expandedTpl.value = expandedTpl.value === code ? null : code;
};

const copyTag = (tag) => {
  navigator.clipboard.writeText(`{${tag}}`);
  alert(`Tag {${tag}} copiado al portapapeles`);
};

const handleDownload = async (code) => {
  try {
    await templatesStore.downloadDocx(code);
  } catch (err) {
    alert(err.message || 'Error al descargar la plantilla');
  }
};

const handleFileUpload = async (event, code) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.name.endsWith('.docx')) {
    alert('Únicamente se permiten archivos con extensión .docx');
    return;
  }

  if (confirm(`¿Confirma reemplazar la plantilla oficial ${code} con el archivo "${file.name}"?`)) {
    try {
      await templatesStore.uploadDocx(code, file);
      alert('Plantilla actualizada exitosamente.');
    } catch (err) {
      alert(err.message || 'Error al actualizar la plantilla');
    }
  }
  event.target.value = '';
};

const handleTestRender = async (code) => {
  try {
    await templatesStore.renderTemplate(code, 'pdf', {
      colaborador_nombre: 'Licda. Karina Elizabeth García Méndez',
      cui_dpi: '1984567290101',
      puesto_funcional: 'Directora de Recursos Humanos',
      unidad_administrativa: 'Unidad de Recursos Humanos',
      fecha_solicitud: '2026-09-23',
      fecha_inicio: '2026-10-05',
      fecha_fin: '2026-10-09',
      dias_solicitados: '5',
      saldo_previo: '15',
      saldo_remanente: '10',
      motivo: 'Descanso vacacional ordinario anual reglamentario',
      correlativo: 'SCSPR-TEST-2026-001'
    });
  } catch (err) {
    alert(err.message || 'Error al previsualizar la plantilla');
  }
};
</script>

<style scoped>
.templates-header__desc {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr));
  gap: 1.25rem;
}

.template-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.template-card__title {
  margin: 0.35rem 0 0 0;
  font-size: 1.05rem;
  color: var(--color-institucional, #0c2340);
}

.template-card__desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #475569);
  margin-bottom: 0.75rem;
}

.template-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-bg-alt, #f8fafc);
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.template-vars__toggle {
  background: none;
  border: none;
  color: var(--color-primary, #0c2340);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.template-vars__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 160px;
  overflow-y: auto;
  margin-top: 6px;
  padding: 6px;
  background: var(--color-bg-alt, #f8fafc);
  border-radius: 4px;
}

.var-chip {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--color-border-light, #e2e8f0);
}

.var-chip:hover {
  background: #f1f5f9;
}

.var-chip__tag {
  color: var(--color-dorado, #c5a059);
  font-weight: 600;
}

.var-chip__desc {
  color: var(--color-text-muted, #64748b);
}

.template-card__footer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
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

.alert {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
}

.alert--success {
  background: #dcfce7;
  color: #166534;
}

.alert--danger {
  background: #fee2e2;
  color: #991b1b;
}

.text-xs {
  font-size: 0.75rem;
}

.font-mono {
  font-family: monospace;
}
</style>
