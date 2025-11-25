<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Gestión de Instituciones</h2>
      <button class="btn btn-primary" @click="openModal()">
        <i class="bi bi-plus-lg"></i> Nueva Institución
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else class="card shadow-sm">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col" class="ps-4">Logo</th>
                <th scope="col">Nombre</th>
                <th scope="col">Acrónimo</th>
                <th scope="col">Creado por</th>
                <th scope="col">Actualizado</th>
                <th scope="col" class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inst in institutions" :key="inst.id">
                <td class="ps-4">
                  <SecureImage
                    v-if="inst.logo_url"
                    :src="inst.logo_url"
                    alt="Logo"
                    class="rounded"
                    style="width: 40px; height: 40px; object-fit: contain;"
                  />
                  <span v-else class="text-muted"><i class="bi bi-image"></i></span>
                </td>
                <td>{{ inst.name }}</td>
                <td><span class="badge bg-secondary">{{ inst.acronym }}</span></td>
                <td>{{ inst.created_by }}</td>
                <td>{{ formatDate(inst.updated_at) }}</td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(inst)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(inst)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="institutions.length === 0">
                <td colspan="6" class="text-center py-4 text-muted">
                  No hay instituciones registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="institutionModal" tabindex="-1" aria-hidden="true" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Editar Institución' : 'Nueva Institución' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveInstitution">
              <div class="mb-3">
                <label for="name" class="form-label">Nombre</label>
                <input type="text" class="form-control" id="name" v-model="form.name" required>
              </div>
              <div class="mb-3">
                <label for="acronym" class="form-label">Acrónimo</label>
                <input type="text" class="form-control" id="acronym" v-model="form.acronym" required>
              </div>
              <div class="mb-3">
                <label for="logo" class="form-label">Logo</label>
                <input type="file" class="form-control" id="logo" @change="handleFileUpload" accept="image/*">
                <div v-if="isEditing && form.currentLogoUrl" class="mt-2">
                  <small class="text-muted">Logo actual:</small>
                  <SecureImage :src="form.currentLogoUrl" alt="Current Logo" class="d-block mt-1" style="height: 50px;" />
                </div>
              </div>
              <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useAgendasStore } from '@/stores/agendas.store';
import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';
import SecureImage from '@/components/shared/SecureImage.vue';

const store = useAgendasStore();
const institutions = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const modalRef = ref<HTMLElement | null>(null);
let modalInstance: Modal | null = null;

const isEditing = ref(false);
const form = reactive({
  id: null as number | null,
  name: '',
  acronym: '',
  logo: null as File | null,
  currentLogoUrl: null as string | null
});

onMounted(async () => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
  }
  await loadInstitutions();
});

const loadInstitutions = async () => {
  loading.value = true;
  try {
    institutions.value = await store.fetchInstitutions();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const openModal = (inst?: any) => {
  if (inst) {
    isEditing.value = true;
    form.id = inst.id;
    form.name = inst.name;
    form.acronym = inst.acronym;
    form.currentLogoUrl = inst.logo_url;
    form.logo = null;
  } else {
    isEditing.value = false;
    form.id = null;
    form.name = '';
    form.acronym = '';
    form.currentLogoUrl = null;
    form.logo = null;
  }
  modalInstance?.show();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    form.logo = target.files[0];
  }
};

const saveInstitution = async () => {
  saving.value = true;
  const formData = new FormData();
  formData.append('name', form.name);
  formData.append('acronym', form.acronym);
  if (form.logo) {
    formData.append('logo', form.logo);
  }

  try {
    if (isEditing.value && form.id) {
      await store.updateInstitution(form.id, formData);
    } else {
      await store.createInstitution(formData);
    }
    modalInstance?.hide();
    await loadInstitutions();
    Swal.fire('Éxito', 'Institución guardada correctamente', 'success');
  } catch (error) {
    Swal.fire('Error', 'No se pudo guardar la institución', 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (inst: any) => {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: `Se eliminará la institución "${inst.name}"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await store.deleteInstitution(inst.id);
      await loadInstitutions();
      Swal.fire('Eliminado', 'La institución ha sido eliminada.', 'success');
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar la institución', 'error');
    }
  }
};

const getLogoUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
};
</script>
