<template>
  <div class="container-fluid">
    <h2 class="mb-4">Asignación de Usuarios</h2>

    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <label for="institutionSelect" class="form-label fw-bold">Seleccionar Institución</label>
        <select 
          id="institutionSelect" 
          class="form-select" 
          v-model="selectedInstitutionId" 
          @change="loadAssignments"
        >
          <option :value="null" disabled>-- Seleccione una institución --</option>
          <option v-for="inst in institutions" :key="inst.id" :value="inst.id">
            {{ inst.name }} ({{ inst.acronym }})
          </option>
        </select>
      </div>
    </div>

    <div v-if="selectedInstitutionId">
      <div class="row">
        <!-- Search & Assign -->
        <div class="col-md-5 mb-4">
          <div class="card shadow-sm h-100">
            <div class="card-header bg-light">
              <h5 class="mb-0">Asignar Nuevo Usuario</h5>
            </div>
            <div class="card-body">
              <div class="input-group mb-3">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Buscar por email..." 
                  v-model="searchEmail"
                  @keyup.enter="searchUsers"
                >
                <button class="btn btn-outline-secondary" type="button" @click="searchUsers" :disabled="searching">
                  <span v-if="searching" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <i v-else class="bi bi-search"></i>
                </button>
              </div>

              <div v-if="searchResults.length > 0" class="list-group">
                <button 
                  v-for="user in searchResults" 
                  :key="user.id"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  @click="assignUser(user)"
                >
                  <div>
                    <div class="fw-bold">{{ user.name }}</div>
                    <small class="text-muted">{{ user.email }}</small>
                  </div>
                  <i class="bi bi-plus-circle text-primary fs-5"></i>
                </button>
              </div>
              <div v-else-if="searchPerformed && searchResults.length === 0" class="text-center text-muted mt-3">
                No se encontraron usuarios.
              </div>
            </div>
          </div>
        </div>

        <!-- Current Assignments -->
        <div class="col-md-7 mb-4">
          <div class="card shadow-sm h-100">
            <div class="card-header bg-light">
              <h5 class="mb-0">Usuarios Asignados</h5>
            </div>
            <div class="card-body p-0">
              <div v-if="loadingAssignments" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>
              <ul v-else class="list-group list-group-flush">
                <li 
                  v-for="user in assignments" 
                  :key="user.id" 
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div class="fw-bold">{{ user.name }}</div>
                    <small class="text-muted">{{ user.email }}</small>
                    <span class="badge bg-info ms-2">{{ user.role }}</span>
                  </div>
                  <button class="btn btn-sm btn-outline-danger" @click="removeAssignment(user)">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </li>
                <li v-if="assignments.length === 0" class="list-group-item text-center text-muted py-4">
                  No hay usuarios asignados a esta institución.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-5 text-muted">
      <i class="bi bi-arrow-up-circle fs-1 d-block mb-2"></i>
      Seleccione una institución para gestionar sus usuarios.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAgendasStore } from '@/stores/agendas.store';
import Swal from 'sweetalert2';

const store = useAgendasStore();
const institutions = ref<any[]>([]);
const selectedInstitutionId = ref<number | null>(null);
const assignments = ref<any[]>([]);
const loadingAssignments = ref(false);

const searchEmail = ref('');
const searchResults = ref<any[]>([]);
const searching = ref(false);
const searchPerformed = ref(false);

onMounted(async () => {
  try {
    institutions.value = await store.fetchInstitutions();
  } catch (error) {
    console.error(error);
  }
});

const loadAssignments = async () => {
  if (!selectedInstitutionId.value) return;
  
  loadingAssignments.value = true;
  try {
    assignments.value = await store.fetchAssignments(selectedInstitutionId.value);
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudieron cargar las asignaciones', 'error');
  } finally {
    loadingAssignments.value = false;
  }
};

const searchUsers = async () => {
  if (!searchEmail.value.trim()) return;
  
  searching.value = true;
  searchPerformed.value = false;
  searchResults.value = [];
  
  try {
    searchResults.value = await store.searchUsers(searchEmail.value);
    searchPerformed.value = true;
  } catch (error) {
    console.error(error);
  } finally {
    searching.value = false;
  }
};

const assignUser = async (user: any) => {
  if (!selectedInstitutionId.value) return;

  // Check if already assigned
  if (assignments.value.some(a => a.id === user.id)) {
    Swal.fire('Aviso', 'El usuario ya está asignado a esta institución', 'info');
    return;
  }

  try {
    await store.createAssignment(user.id, selectedInstitutionId.value);
    await loadAssignments();
    Swal.fire({
      icon: 'success',
      title: 'Asignado',
      text: `Usuario ${user.name} asignado correctamente`,
      timer: 1500,
      showConfirmButton: false
    });
    // Clear search
    searchEmail.value = '';
    searchResults.value = [];
    searchPerformed.value = false;
  } catch (error) {
    Swal.fire('Error', 'No se pudo asignar el usuario', 'error');
  }
};

const removeAssignment = async (user: any) => {
  if (!selectedInstitutionId.value) return;

  const result = await Swal.fire({
    title: '¿Desasignar usuario?',
    text: `Se quitará el acceso de ${user.name} a esta institución`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, desasignar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await store.deleteAssignment(user.id, selectedInstitutionId.value);
      await loadAssignments();
      Swal.fire('Desasignado', 'El usuario ha sido removido.', 'success');
    } catch (error) {
      Swal.fire('Error', 'No se pudo remover la asignación', 'error');
    }
  }
};
</script>
