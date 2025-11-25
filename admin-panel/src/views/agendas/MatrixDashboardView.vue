<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4 fw-bold">Matriz Consolidada</h2>
      <div class="d-flex gap-3">
        <select v-model="selectedWeek" @change="loadMatrix" class="form-select">
           <option v-for="w in weeks" :key="w.id" :value="w.id">
              {{ w.label }}
            </option>
        </select>
        <button @click="loadMatrix" class="btn btn-primary">
          Actualizar
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">Cargando matriz...</div>

    <div v-else class="table-responsive">
      <table class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th class="text-start" style="width: 200px;">Institución</th>
            <th class="text-start">Temas Semanales</th>
            <th class="text-start">Visitas Presidenciales</th>
            <th class="text-start">Alertas</th>
            <th class="text-center" style="width: 100px;">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inst in matrix" :key="inst.institution_id">
            <td class="align-middle">
              <div class="d-flex align-items-center">
                <img v-if="inst.logo_url" :src="inst.logo_url" class="me-2" style="width: 24px; height: 24px; object-fit: contain;"/>
                <span class="fw-bold">{{ inst.acronym }}</span>
              </div>
            </td>
            
            <!-- Temas Semanales -->
            <td class="align-top">
              <ul class="list-unstyled mb-0">
                <li v-for="(item, idx) in getItems(inst.items, 'WEEKLY_TOPIC')" :key="idx" class="mb-1">
                  • {{ item.description }}
                </li>
              </ul>
            </td>

            <!-- Visitas -->
            <td class="align-top">
              <ul class="list-unstyled mb-0">
                <li v-for="(item, idx) in getItems(inst.items, 'PRESIDENTIAL_VISIT')" :key="idx" class="mb-1">
                  • {{ item.description }} <span v-if="item.date" class="text-muted small">({{ item.date }})</span>
                </li>
              </ul>
            </td>

             <!-- Alertas -->
            <td class="align-top">
               <div v-for="(item, idx) in getItems(inst.items, 'POLITICAL_ALERT')" :key="idx" class="mb-1 d-flex align-items-center gap-2">
                  <span 
                    class="d-inline-block rounded-circle"
                    style="width: 10px; height: 10px;"
                    :class="{
                        'bg-danger': item.alert_level === 'HIGH',
                        'bg-warning': item.alert_level === 'MEDIUM',
                        'bg-info': item.alert_level === 'LOW',
                        'bg-secondary': !item.alert_level
                    }"
                  ></span>
                  {{ item.description }}
               </div>
            </td>

            <!-- Estado -->
            <td class="text-center align-middle">
              <span 
                class="badge rounded-pill"
                :class="{
                  'text-bg-success': inst.status === 'COMPLETED',
                  'text-bg-warning': inst.status === 'DRAFT',
                  'text-bg-secondary': !inst.status
                }"
              >
                {{ inst.status || 'Pendiente' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAgendasStore } from '@/stores/agendas.store'
import { storeToRefs } from 'pinia'

const store = useAgendasStore()
const { matrix, loading } = storeToRefs(store)
const selectedWeek = ref<number | null>(null)
const weeks = ref<any[]>([])

const loadMatrix = async () => {
  if (!selectedWeek.value) return
  const currentYear = new Date().getFullYear()
  await store.fetchMatrix(currentYear, selectedWeek.value)
}

const getItems = (items: any[], type: string) => {
  return items.filter(i => i.type === type)
}

onMounted(async () => {
    const currentYear = new Date().getFullYear()
    weeks.value = await store.fetchWeeks(currentYear)
    
    if (weeks.value.length > 0) {
        selectedWeek.value = weeks.value[0].id
        await loadMatrix()
    }
})
</script>
