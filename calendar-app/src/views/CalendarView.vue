<script setup>
import { ref, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { useAuthStore } from '../stores/auth'
import { useCalendarStore } from '../stores/calendar'
import { useRouter } from 'vue-router'
import EventModal from '../components/EventModal.vue'

const authStore = useAuthStore()
const calendarStore = useCalendarStore()
const router = useRouter()
const calendarRef = ref(null)

// --- Estado del Modal ---
const isModalOpen = ref(false)
const selectedEvent = ref(null) // Objeto para editar/crear

// --- Configuración FullCalendar ---
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek'
  },
  locale: esLocale,
  selectable: true,
  editable: true,

  // 1. Cargar eventos bajo demanda (Lazy Loading por rango de fechas)
  events: async (info, successCallback, failureCallback) => {
    // info.startStr e info.endStr son proveídos por FullCalendar
    // y corresponden exactamente a la vista actual (mes/semana).
    const events = await calendarStore.fetchEvents(info.startStr, info.endStr)
    if (events) {
      // Mapear al formato de FullCalendar
      const mapped = events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start_date,
        end: e.end_date,
        extendedProps: {
          description: e.description,
          location: e.location
        }
      }))
      successCallback(mapped)
    } else {
      failureCallback('Error cargando eventos')
    }
  },

  // 2. Click en fecha (Crear)
  dateClick: (info) => {
    selectedEvent.value = {
      startStr: info.dateStr,
      endStr: info.dateStr, // Por defecto mismo día
      allDay: info.allDay
    }
    isModalOpen.value = true
  },

  // 3. Click en evento (Editar)
  eventClick: (info) => {
    selectedEvent.value = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      extendedProps: info.event.extendedProps
    }
    isModalOpen.value = true
  }
})

// --- Controladores del Modal ---
const closeModal = () => {
  isModalOpen.value = false
  selectedEvent.value = null
}

const saveEvent = async (payload) => {
  let success = false
  if (selectedEvent.value.id) {
    // Actualizar
    success = await calendarStore.updateEvent(selectedEvent.value.id, payload)
  } else {
    // Crear
    success = await calendarStore.createEvent(payload)
  }

  if (success) {
    closeModal()
    refetchEvents()
  }
}

const deleteEvent = async () => {
  if (!selectedEvent.value.id) return

  // El sweetalert de confirmación puede estar aquí o en el store, 
  // en este caso el store ya teniá un alert básico, pero mejor confirmar antes.
  if (confirm('¿Estás seguro de eliminar este evento?')) {
    const success = await calendarStore.deleteEvent(selectedEvent.value.id)
    if (success) {
      closeModal()
      refetchEvents()
    }
  }
}

const refetchEvents = () => {
  // Forzar recarga del calendario
  const calendarApi = calendarRef.value.getApi()
  calendarApi.refetchEvents()
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <header class="bg-blue-800 text-white p-4 flex justify-between items-center shadow-md z-10">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold">Calendario SCSPR</h1>
        <!-- Botón rápido para crear evento hoy -->
        <button @click="() => { selectedEvent = null; isModalOpen = true }"
          class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm transition font-semibold">
          + Nuevo Evento
        </button>
      </div>
      <button @click="handleLogout"
        class="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm font-semibold transition">
        Cerrar Sesión
      </button>
    </header>

    <main class="flex-grow p-4 overflow-hidden relative">
      <div class="bg-white rounded-lg shadow-lg h-full p-4">
        <FullCalendar ref="calendarRef" :options="calendarOptions" class="h-full" />
      </div>
    </main>

    <!-- Modal Component -->
    <EventModal :isOpen="isModalOpen" :event="selectedEvent" @close="closeModal" @save="saveEvent"
      @delete="deleteEvent" />
  </div>
</template>

<style>
/* Estilos personalizados para FullCalendar */
.fc-toolbar-title {
  font-size: 1.25rem !important;
  text-transform: capitalize;
}

.fc-button-primary {
  background-color: #2563eb !important;
  /* Tailwind blue-600 */
  border-color: #2563eb !important;
}

.fc-button-primary:hover {
  background-color: #1d4ed8 !important;
  /* Tailwind blue-700 */
  border-color: #1d4ed8 !important;
}
</style>
