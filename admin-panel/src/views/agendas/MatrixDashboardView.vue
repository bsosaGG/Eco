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
      <table class="table table-bordered table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th class="text-start" style="width: 200px;">
              <div class="d-flex align-items-center justify-content-between">
                <span>Institución</span>
                <button @click="toggleInstitutionSort" class="btn btn-sm btn-link text-dark p-0">
                  <i class="bi" :class="{
                    'bi-filter': institutionSort === 'NONE',
                    'bi-sort-alpha-down': institutionSort === 'ASC',
                    'bi-sort-alpha-up': institutionSort === 'DESC'
                  }"></i>
                </button>
              </div>
            </th>
            <th v-for="type in itemTypes" :key="type.key" class="text-start">
              <div class="d-flex align-items-center justify-content-between">
                <span>{{ type.label }}</span>
                <button v-if="type.key === 'WEEKLY_TOPIC'" @click="toggleColumnSort(type.key)"
                  class="btn btn-sm btn-link text-dark p-0">
                  <i class="bi" :class="{
                    'bi-filter': (!columnSorts[type.key] || columnSorts[type.key] === 'NONE'),
                    'bi-sort-down': columnSorts[type.key] === 'ASC',
                    'bi-sort-up': columnSorts[type.key] === 'DESC'
                  }"></i>
                </button>
              </div>
            </th>
            <th class="text-center" style="width: 100px;">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inst in sortedMatrix" :key="inst.institution_id">
            <td class="align-middle">
              <div class="d-flex align-items-center">
                <SecureImage v-if="inst.logo_url" :src="inst.logo_url" class="me-2"
                  style="width: 50px; height: 50px; object-fit: contain;" />
                <span class="fw-bold">{{ inst.acronym }}</span>
              </div>
            </td>

            <!-- Temas Semanales -->
            <td v-for="type in itemTypes" :key="type.key" class="text-start">
              <!-- Caso: Alertas Políticas -->
              <div v-if="type.key === 'POLITICAL_ALERT'">
                <div v-for="(item, idx) in getItems(inst.items, type.key)" :key="idx"
                  class="mb-1 d-flex align-items-center gap-2">
                  <span class="d-inline-block rounded-circle flex-shrink-0" style="width: 10px; height: 10px;" :class="{
                    'bg-danger': item.alert_level === 'HIGH',
                    'bg-warning': item.alert_level === 'MEDIUM',
                    'bg-info': item.alert_level === 'LOW',
                    'bg-secondary': !item.alert_level
                  }"></span>
                  <span>
                    {{ truncateText(item.description) }}
                    <a v-if="item.description && item.description.length > 50" href="#"
                      @click.prevent="openModal(item.description)" class="text-primary ms-1 text-decoration-none small">
                      <i class="bi bi-eye"></i>
                    </a>
                  </span>
                </div>
              </div>

              <!-- Caso: Enlaces Importantes -->
              <ul v-else-if="type.key === 'IMPORTANT_LINK'" class="list-unstyled mb-0">
                <li v-for="(item, idx) in getItems(inst.items, type.key)" :key="idx" class="mb-1">
                  <a :href="item.url" target="_blank" class="text-decoration-none">
                    🔗 {{ truncateText(item.description) }}
                  </a>
                  <a v-if="item.description && item.description.length > 50" href="#"
                    @click.prevent="openModal(item.description)" class="text-primary ms-1 text-decoration-none small">
                    <i class="bi bi-eye"></i>
                  </a>
                </li>
              </ul>

              <!-- Caso: Visitas Presidenciales -->
              <ul v-else-if="type.key === 'PRESIDENTIAL_VISIT'" class="list-unstyled mb-0">
                <li v-for="(item, idx) in getItems(inst.items, type.key)" :key="idx" class="mb-1">
                  • {{ truncateText(item.description) }}
                  <span v-if="item.date" class="text-muted small">({{ item.date }})</span>
                  <a v-if="item.description && item.description.length > 50" href="#"
                    @click.prevent="openModal(item.description)" class="text-primary ms-1 text-decoration-none small">
                    <i class="bi bi-eye"></i>
                  </a>
                </li>
              </ul>

              <!-- Default: Temas Semanales, Hot Topics, etc. -->
              <ul v-else class="list-unstyled mb-0">
                <li v-for="(item, idx) in getItems(inst.items, type.key)" :key="idx" class="mb-1">
                  • {{ truncateText(item.description) }}
                  <span v-if="item.date" class="text-muted small">({{ item.date }})</span>
                  <a v-if="item.description && item.description.length > 50" href="#"
                    @click.prevent="openModal(item.description)" class="text-primary ms-1 text-decoration-none small">
                    <i class="bi bi-eye"></i>
                  </a>
                </li>
              </ul>
            </td>

            <!-- Estado -->
            <td class="text-center align-middle">
              <span class="badge rounded-pill" :class="{
                'text-bg-success': inst.status === 'COMPLETED',
                'text-bg-warning': inst.status === 'DRAFT',
                'text-bg-secondary': !inst.status
              }">
                {{ inst.status || 'Pendiente' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Lectura -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Ítem</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <p>{{ selectedItemDescription }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAgendasStore } from '@/stores/agendas.store'
import { storeToRefs } from 'pinia'
import SecureImage from '@/components/shared/SecureImage.vue'

const store = useAgendasStore()
const { matrix, loading, itemTypes } = storeToRefs(store)
const selectedWeek = ref<number | null>(null)
const weeks = ref<any[]>([])
const showModal = ref(false)
const selectedItemDescription = ref('')

// Sorting State
const institutionSort = ref<'NONE' | 'ASC' | 'DESC'>('NONE')
const columnSorts = ref<Record<string, 'NONE' | 'ASC' | 'DESC'>>({})

const truncateText = (text: string, limit: number = 50) => {
  if (!text) return ''
  if (text.length <= limit) return text
  return text.substring(0, limit) + '...'
}

const openModal = (description: string) => {
  selectedItemDescription.value = description
  showModal.value = true
}

const loadMatrix = async () => {
  if (!selectedWeek.value) return
  const currentYear = new Date().getFullYear()
  await store.fetchMatrix(currentYear, selectedWeek.value)
}

// Sorting Logic
const toggleInstitutionSort = () => {
  const modes: ('NONE' | 'ASC' | 'DESC')[] = ['NONE', 'ASC', 'DESC']
  const currentIdx = modes.indexOf(institutionSort.value)
  institutionSort.value = modes[(currentIdx + 1) % modes.length]
}

const toggleColumnSort = (key: string) => {
  const current = columnSorts.value[key] || 'NONE'
  const modes: ('NONE' | 'ASC' | 'DESC')[] = ['NONE', 'ASC', 'DESC']
  const currentIdx = modes.indexOf(current)
  columnSorts.value = {
    ...columnSorts.value,
    [key]: modes[(currentIdx + 1) % modes.length]
  }
}

const sortedMatrix = computed(() => {
  let items = [...matrix.value]
  if (institutionSort.value === 'NONE') return items

  return items.sort((a, b) => {
    const nameA = a.acronym || ''
    const nameB = b.acronym || ''
    if (institutionSort.value === 'ASC') return nameA.localeCompare(nameB)
    return nameB.localeCompare(nameA)
  })
})

const getSortedItems = (items: any[], type: string) => {
  const filtered = items.filter(i => i.type === type)
  const sortDir = columnSorts.value[type] || 'NONE'

  if (sortDir === 'NONE') return filtered

  return filtered.sort((a, b) => {
    const dateA = a.date || ''
    const dateB = b.date || ''

    // Handle null/empty dates
    if (!dateA && !dateB) return 0
    if (!dateA) return sortDir === 'ASC' ? -1 : 1
    if (!dateB) return sortDir === 'ASC' ? 1 : -1

    if (sortDir === 'ASC') return dateA.localeCompare(dateB)
    return dateB.localeCompare(dateA)
  })
}

const getItems = (items: any[], type: string) => {
  return getSortedItems(items, type)
}

onMounted(async () => {
  const currentYear = new Date().getFullYear()
  weeks.value = await store.fetchWeeks(currentYear)
  await store.fetchItemTypes()

  if (weeks.value.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const currentWeek = weeks.value.find((w: any) => {
      if (!w.start_date || !w.end_date) return false

      const start = new Date(w.start_date)
      const end = new Date(w.end_date)

      // Normalizar fechas
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      return today >= start && today <= end
    })

    if (currentWeek) {
      selectedWeek.value = currentWeek.id
    } else {
      selectedWeek.value = weeks.value[0].id
    }

    await loadMatrix()
  }
})
</script>
```
