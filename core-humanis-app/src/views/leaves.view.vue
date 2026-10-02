<template>
  <div class="leaves-view">
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Gestión de Licencias Médicas e Incidencias (IGSS / Ausencias)</h2>
          <p class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">
            Registro de suspensiones por enfermedad o maternidad (IGSS), duelos y licencias institucionales.
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--primary" @click="showModal = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Registrar Licencia
          </button>
        </div>
      </div>
    </div>

    <!-- TABLA DE LICENCIAS -->
    <div class="card">
      <div class="card__header">
        <h4 class="font-heading">Historial de Licencias e Incapacidades Registradas</h4>
        <span class="badge badge--info">{{ vacationsStore.leaves.length }} registros</span>
      </div>
      <div class="card__body">
        <div class="data-table-container table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">Correlativo</th>
                <th class="data-table__th">Colaborador</th>
                <th class="data-table__th">Tipo de Licencia</th>
                <th class="data-table__th">Periodo</th>
                <th class="data-table__th">Días Totales</th>
                <th class="data-table__th">No. Soporte / IGSS</th>
                <th class="data-table__th">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!vacationsStore.leaves.length">
                <td colspan="7" class="data-table__td" style="text-align: center; color: var(--text-muted);">
                  No hay licencias ni ausencias registradas actualmente.
                </td>
              </tr>
              <tr v-for="l in vacationsStore.leaves" :key="l.id" class="data-table__row">
                <td class="data-table__td" style="font-weight: 600;">{{ l.correlativo }}</td>
                <td class="data-table__td">{{ l.colaborador_nombre || 'Colaborador Institucional' }}</td>
                <td class="data-table__td">
                  <span class="badge badge--neutral">{{ formatTipo(l.tipo_licencia) }}</span>
                </td>
                <td class="data-table__td">{{ l.fecha_inicio }} al {{ l.fecha_fin }}</td>
                <td class="data-table__td" style="text-align: center;">{{ l.dias_totales }} días</td>
                <td class="data-table__td">{{ l.documento_soporte_num || 'N/A' }}</td>
                <td class="data-table__td">
                  <span class="badge badge--success">APROBADO</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL REGISTRO DE LICENCIA -->
    <div v-if="showModal" class="modal__overlay" @click.self="showModal = false">
      <div class="modal__content card">
        <div class="modal__header card__header">
          <h3 class="font-heading">Registrar Licencia Médica / Permiso</h3>
          <button class="btn btn--sm btn--secondary" @click="showModal = false">&times;</button>
        </div>
        <div class="modal__body card__body">
          <form @submit.prevent="handleCreateLeave">
            <div class="form-group">
              <label class="form-group__label">Colaborador:</label>
              <select v-model="form.persona_id" class="form-group__control" required>
                <option value="" disabled>Seleccione colaborador...</option>
                <option v-for="c in colabStore.colaboradores" :key="c.id" :value="c.id">
                  {{ c.primer_nombre }} {{ c.primer_apellido }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-group__label">Tipo de Licencia:</label>
              <select v-model="form.tipo_licencia" class="form-group__control" required>
                <option value="IGSS_ENFERMEDAD">Incapacidad IGSS (Enfermedad / Accidente)</option>
                <option value="IGSS_MATERNIDAD">Incapacidad IGSS (Maternidad)</option>
                <option value="DUELO">Licencia por Duelo (Fallecimiento Familiar)</option>
                <option value="PATERNIDAD">Licencia por Paternidad</option>
                <option value="CON_GOCE_SUELDO">Permiso con Goce de Sueldo</option>
                <option value="SIN_GOCE_SUELDO">Licencia sin Goce de Sueldo</option>
                <option value="COMISION_OFICIAL">Comisión Oficial de Trabajo</option>
              </select>
            </div>

            <div class="grid grid--2">
              <div class="form-group">
                <label class="form-group__label">Fecha Inicio:</label>
                <input type="date" v-model="form.fecha_inicio" class="form-group__control" required />
              </div>
              <div class="form-group">
                <label class="form-group__label">Fecha Fin:</label>
                <input type="date" v-model="form.fecha_fin" class="form-group__control" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-group__label">No. Soporte / Caso IGSS / Certificado:</label>
              <input type="text" v-model="form.documento_soporte_num" class="form-group__control" placeholder="Ej. IGSS-INC-2026-9811" />
            </div>

            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn btn--primary">Registrar Licencia</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useVacationsStore } from '../stores/vacations.store';
import { useCollaboratorsStore } from '../stores/collaborators.store';
import { useToast } from '../composables/useToast';

const vacationsStore = useVacationsStore();
const colabStore = useCollaboratorsStore();
const toast = useToast();

const showModal = ref(false);
const form = reactive({
  persona_id: '',
  tipo_licencia: 'IGSS_ENFERMEDAD',
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: new Date().toISOString().split('T')[0],
  documento_soporte_num: ''
});

onMounted(async () => {
  await vacationsStore.fetchLeaves();
  if (!colabStore.colaboradores.length) {
    await colabStore.fetchColaboradores();
  }
});

function formatTipo(tipo) {
  const map = {
    'IGSS_ENFERMEDAD': 'IGSS Enfermedad',
    'IGSS_MATERNIDAD': 'IGSS Maternidad',
    'DUELO': 'Licencia por Duelo',
    'PATERNIDAD': 'Licencia Paternidad',
    'CON_GOCE_SUELDO': 'Permiso con Goce',
    'SIN_GOCE_SUELDO': 'Licencia sin Goce',
    'COMISION_OFICIAL': 'Comisión Oficial'
  };
  return map[tipo] || tipo;
}

async function handleCreateLeave() {
  await vacationsStore.fetchLeaves();
  showModal.value = false;
  toast.success('Licencia médica registrada correctamente.');
}
</script>
