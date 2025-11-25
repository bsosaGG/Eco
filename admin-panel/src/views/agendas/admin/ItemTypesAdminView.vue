<template>
  <div class="container-fluid">
    <h2 class="mb-4">Tipos de Temas de Agenda</h2>

    <div class="alert alert-info d-flex align-items-center" role="alert">
      <i class="bi bi-info-circle-fill flex-shrink-0 me-2"></i>
      <div>
        Los tipos de temas son constantes del sistema. Solo se permite modificar su etiqueta visible y el orden de aparición.
      </div>
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
                <th scope="col" class="ps-4">Orden</th>
                <th scope="col">Clave (Key)</th>
                <th scope="col">Etiqueta (Label)</th>
                <th scope="col" class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="type in itemTypes" :key="type.key">
                <td class="ps-4">
                  <span class="badge bg-light text-dark border">{{ type.order_index }}</span>
                </td>
                <td><code>{{ type.key }}</code></td>
                <td>{{ type.label }}</td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-primary" @click="openModal(type)">
                    <i class="bi bi-pencil"></i> Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="itemTypeModal" tabindex="-1" aria-hidden="true" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar Tipo de Tema</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveItemType">
              <div class="mb-3">
                <label for="key" class="form-label">Clave (No editable)</label>
                <input type="text" class="form-control" id="key" v-model="form.key" disabled readonly>
              </div>
              <div class="mb-3">
                <label for="label" class="form-label">Etiqueta</label>
                <input type="text" class="form-control" id="label" v-model="form.label" required>
              </div>
              <div class="mb-3">
                <label for="order" class="form-label">Orden</label>
                <input type="number" class="form-control" id="order" v-model="form.order_index" required>
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

const store = useAgendasStore();
const itemTypes = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const modalRef = ref<HTMLElement | null>(null);
let modalInstance: Modal | null = null;

const form = reactive({
  key: '',
  label: '',
  order_index: 0
});

onMounted(async () => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
  }
  await loadItemTypes();
});

const loadItemTypes = async () => {
  loading.value = true;
  try {
    itemTypes.value = await store.fetchItemTypes();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const openModal = (type: any) => {
  form.key = type.key;
  form.label = type.label;
  form.order_index = type.order_index;
  modalInstance?.show();
};

const saveItemType = async () => {
  saving.value = true;
  try {
    await store.updateItemType(form.key, form.label, form.order_index);
    modalInstance?.hide();
    await loadItemTypes();
    Swal.fire('Éxito', 'Tipo de tema actualizado correctamente', 'success');
  } catch (error) {
    Swal.fire('Error', 'No se pudo actualizar el tipo de tema', 'error');
  } finally {
    saving.value = false;
  }
};
</script>
