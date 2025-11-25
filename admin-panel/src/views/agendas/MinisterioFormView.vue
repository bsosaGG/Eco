<template>
  <div>
    <div v-if="loadingAssignment" class="text-center py-4">Cargando asignación...</div>
    <div v-else-if="!myAssignment" class="alert alert-danger">
      No tienes un ministerio asignado. Contacta al administrador.
    </div>
    
    <div v-else>
      <div class="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
        <div class="d-flex align-items-center gap-3">
          <img 
            v-if="myAssignment.logo_url" 
            :src="myAssignment.logo_url" 
            alt="Logo" 
            class="img-fluid"
            style="height: 48px; width: 48px; object-fit: contain;"
          />
          <div>
            <h2 class="h5 mb-0">{{ myAssignment.name }}</h2>
            <p class="text-muted small mb-0">{{ myAssignment.acronym }}</p>
          </div>
        </div>
        
        <div class="d-flex align-items-center gap-3">
          <label class="fw-bold">Semana:</label>
          <select 
            v-model="selectedWeek" 
            @change="loadWeekData"
            class="form-select"
            style="width: auto;"
          >
            <option v-for="w in weeks" :key="w.id" :value="w.id">
              {{ w.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="loadingData" class="text-center py-5">Cargando datos de la semana...</div>
      
      <div v-else>
        <div class="d-flex justify-content-end mb-3">
          <span 
            v-if="currentStatus" 
            class="badge rounded-pill"
            :class="{
              'text-bg-warning': currentStatus === 'DRAFT',
              'text-bg-success': currentStatus === 'COMPLETED'
            }"
          >
            Estado: {{ currentStatus }}
          </span>
        </div>

        <!-- Secciones del Formulario -->
        <div class="vstack gap-4">
          <section v-for="type in itemTypes" :key="type.key" class="card bg-light border-0">
            <div class="card-body">
              <h3 class="h6 fw-bold text-secondary mb-3">{{ type.label }}</h3>
              
              <div class="vstack gap-3">
                <div 
                  v-for="(item, index) in getItemsByType(type.key)" 
                  :key="index" 
                  class="card border-0 shadow-sm"
                >
                  <div class="card-body p-3">
                    <div class="d-flex gap-3 align-items-start">
                      <div class="flex-grow-1 row g-3">
                        <!-- Fecha (Opcional) -->
                        <div class="col-md-2">
                          <input 
                            type="date" 
                            v-model="item.date" 
                            class="form-control form-control-sm"
                            placeholder="Fecha"
                          />
                        </div>
                        
                        <!-- Descripción -->
                        <div class="col-md-7">
                          <textarea 
                            v-model="item.description" 
                            rows="2"
                            class="form-control form-control-sm"
                            placeholder="Descripción del tema..."
                          ></textarea>
                        </div>

                        <!-- URL y Alerta -->
                        <div class="col-md-3 d-flex flex-column gap-2">
                           <input 
                            type="text" 
                            v-model="item.url" 
                            class="form-control form-control-sm"
                            placeholder="URL (Opcional)"
                          />
                          <select v-model="item.alert_level" class="form-select form-select-sm">
                              <option :value="null">Sin Alerta</option>
                              <option value="LOW">Baja</option>
                              <option value="MEDIUM">Media</option>
                              <option value="HIGH">Alta</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        @click="removeItem(item)"
                        class="btn btn-link text-danger p-0"
                        title="Eliminar"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  @click="addItem(type.key)"
                  class="btn btn-link text-decoration-none btn-sm text-start ps-0"
                >
                  <i class="bi bi-plus-circle me-1"></i> Agregar Ítem
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- Botones de Acción -->
        <div class="mt-4 d-flex justify-content-end gap-2 border-top pt-3">
          <button 
            @click="save('DRAFT')"
            :disabled="saving"
            class="btn btn-outline-secondary"
          >
            {{ saving ? 'Guardando...' : 'Guardar Borrador' }}
          </button>
          <button 
            @click="save('COMPLETED')"
            :disabled="saving"
            class="btn btn-primary"
          >
            {{ saving ? 'Guardando...' : 'Finalizar Semana' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAgendasStore } from '@/stores/agendas.store'
import { storeToRefs } from 'pinia'

const store = useAgendasStore()
const { myAssignment, currentWeekEntry } = storeToRefs(store)

const loadingAssignment = ref(true)
const loadingData = ref(false)
const saving = ref(false)
const selectedWeek = ref<number | null>(null)
const currentStatus = ref<string | null>(null)

const weeks = ref<any[]>([])
const itemTypes = ref<any[]>([])

// Estado local para los items del formulario
const formItems = ref<any[]>([])

const getItemsByType = (type: string) => {
  return formItems.value.filter(item => item.type === type)
}

const addItem = (type: string) => {
  formItems.value.push({
    type,
    description: '',
    date: '',
    url: '',
    alert_level: null,
    tempId: Date.now() // Para key única en v-for si fuera necesario
  })
}

const removeItem = (itemToRemove: any) => {
  formItems.value = formItems.value.filter(item => item !== itemToRemove)
}

const loadWeekData = async () => {
  if (!selectedWeek.value) return
  
  loadingData.value = true
  try {
    await store.fetchWeeklyEntry(selectedWeek.value)
    
    if (currentWeekEntry.value && currentWeekEntry.value.items) {
      // Cargar datos existentes
      formItems.value = JSON.parse(JSON.stringify(currentWeekEntry.value.items))
      currentStatus.value = currentWeekEntry.value.report.status
    } else {
      // Limpiar formulario
      formItems.value = []
      currentStatus.value = null
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingData.value = false
  }
}

const save = async (status: string) => {
  if (!selectedWeek.value) return
  
  saving.value = true
  try {
    // Limpiar datos antes de enviar (quitar tempId si existe)
    const payload = formItems.value.map(({ tempId, ...rest }) => rest)
    
    await store.saveWeeklyAgenda(selectedWeek.value, payload, status)
    currentStatus.value = status
    alert('Guardado correctamente')
  } catch (e) {
    alert('Error al guardar')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await store.fetchMyAssignment()
    
    // Cargar catálogos
    const currentYear = new Date().getFullYear()
    weeks.value = await store.fetchWeeks(currentYear)
    itemTypes.value = await store.fetchItemTypes()

    // Seleccionar semana actual si es posible (lógica simple: primera semana o la actual por fecha)
    // Por ahora seleccionamos la primera disponible si no hay una seleccionada
    if (weeks.value.length > 0) {
        // Intentar buscar la semana actual basada en fecha podría ser una mejora
        selectedWeek.value = weeks.value[0].id
    }

  } finally {
    loadingAssignment.value = false
  }
  
  // Cargar datos de la semana seleccionada
  if (myAssignment.value && selectedWeek.value) {
    await loadWeekData()
  }
})
</script>
