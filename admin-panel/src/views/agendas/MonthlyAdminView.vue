<template>
  <div>
    <h2 class="h4 fw-bold mb-4">Gestión Mensual</h2>
    
    <div class="d-flex gap-3 mb-4">
      <select v-model="selectedYear" class="form-select" style="width: auto;">
        <option :value="currentYear">{{ currentYear }}</option>
        <option :value="currentYear - 1">{{ currentYear - 1 }}</option>
      </select>
      <select v-model="selectedMonth" @change="loadData" class="form-select" style="width: auto;">
        <option v-for="m in 12" :key="m" :value="m">Mes {{ m }}</option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-5">Cargando...</div>

    <div v-else class="row g-4">
      <div 
        v-for="inst in monthlyOverview" 
        :key="inst.institution_id"
        class="col-md-6 col-lg-4"
      >
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
               <SecureImage v-if="inst.logo_url" :src="inst.logo_url" style="width: 40px; height: 40px; object-fit: contain;"/>
               <div>
                 <h5 class="card-title mb-0">{{ inst.acronym }}</h5>
                 <p class="card-text text-muted small">{{ inst.institution_name }}</p>
               </div>
            </div>

            <!-- Progreso -->
            <div class="mb-3">
              <div class="d-flex justify-content-between text-sm mb-1">
                <span>Progreso Semanal</span>
                <span class="fw-bold">{{ inst.progress_percent }}%</span>
              </div>
              <div class="progress" style="height: 10px;">
                <div 
                  class="progress-bar bg-primary" 
                  role="progressbar"
                  :style="{ width: inst.progress_percent + '%' }"
                  :aria-valuenow="inst.progress_percent"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>

            <!-- Estado de Cierre -->
            <div class="border-top pt-3">
              <div v-if="inst.is_closed" class="text-success fw-medium d-flex align-items-center gap-2">
                <i class="bi bi-check-circle-fill"></i>
                Mes Cerrado
                <a 
                  v-if="inst.file_url" 
                  href="#" 
                  @click.prevent="downloadFile(inst.file_url)"
                  class="ms-auto text-decoration-underline small"
                >
                  Ver Archivo
                </a>
              </div>

              <div v-else>
                <label class="form-label small text-muted mb-2">Subir Cierre (PDF/Excel)</label>
                <div class="input-group input-group-sm">
                  <input 
                    :id="`file-input-${inst.institution_id}`"
                    type="file" 
                    @change="(e) => handleFileChange(e, inst.institution_id)"
                    class="form-control"
                    accept=".pdf,.xlsx,.xls"
                  />
                  <button 
                    v-if="filesToUpload[inst.institution_id]"
                    @click="uploadFile(inst.institution_id)"
                    class="btn btn-primary"
                  >
                    Subir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAgendasStore } from '@/stores/agendas.store'
import { storeToRefs } from 'pinia'
import { useFileDownloader } from '@/composables/useFileDownloader'
import SecureImage from '@/components/shared/SecureImage.vue'

const { downloadFile } = useFileDownloader()

const store = useAgendasStore()
const { monthlyOverview, loading } = storeToRefs(store)
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const selectedMonth = ref(new Date().getMonth() + 1)
const filesToUpload = ref<Record<number, File>>({})

const loadData = async () => {
  await store.fetchMonthlyOverview(selectedYear.value, selectedMonth.value)
}

const handleFileChange = (event: Event, institutionId: number) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    filesToUpload.value[institutionId] = target.files[0]
  }
}

const uploadFile = async (institutionId: number) => {
  const file = filesToUpload.value[institutionId]
  if (!file) return

  try {
    await store.closeMonth(institutionId, selectedMonth.value, selectedYear.value, file)
    delete filesToUpload.value[institutionId]
    
    // Clear the file input
    const fileInput = document.getElementById(`file-input-${institutionId}`) as HTMLInputElement
    if (fileInput) {
        fileInput.value = ''
    }
    
    alert('Mes cerrado exitosamente')
  } catch (e) {
    alert('Error al subir archivo')
  }
}

onMounted(() => {
  loadData()
})
</script>
