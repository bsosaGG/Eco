<script setup>
import { ref, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es'
import { useAuthStore } from '../stores/auth'
import { useCalendarStore } from '../stores/calendar'
import { useRouter } from 'vue-router'
import EventModal from '../components/EventModal.vue'

const authStore = useAuthStore()
const calendarStore = useCalendarStore()
const router = useRouter()
const calendarRef = ref(null)
const currentTitle = ref('')

// --- Estado del Modal ---
const isModalOpen = ref(false)
const selectedEvent = ref(null) // Objeto para editar/crear

// --- Configuración FullCalendar ---
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin, listPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    right: 'multiMonthYear,dayGridMonth,timeGridWeek'
  },
  locale: esLocale,
  selectable: true,
  editable: true,
  allDaySlot: false,
  fixedWeekCount: false,

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
  },

  datesSet: (arg) => {
    // Se dispara cada vez que el rango de fechas o la vista cambian
    currentTitle.value = arg.view.title.charAt(0).toUpperCase() + arg.view.title.slice(1);
  },
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

const vistasMap = {
  'multiMonthYear': 'listYear',
  'dayGridMonth': 'listMonth',
  'timeGridWeek': 'listWeek',
};

const cambiarVista = () => {
  // 1. Selecciona el botón que tiene la clase 'fc-button-active'
  const botonActivo = document.querySelector('.fc-button-group .fc-button-active');

  if (botonActivo) {
    // 2. Extraer el nombre de la vista de sus clases de FullCalendar
    // Ejemplo: de 'fc-dayGridMonth-button' extraemos 'dayGridMonth'
    const vistaClase = [...botonActivo.classList].find(cls => cls.includes('-button') && cls.startsWith('fc-'));
    const vistaId = vistaClase.replace('fc-', '').replace('-button', '');

    // 3. Llamada dinámica
    calendarRef.value.getApi().changeView(vistasMap[vistaId]);
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <header class="bg-[#0D1B46] text-white p-4 flex justify-between items-center shadow-md z-10">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold">{{ currentTitle }}</h1>
      </div>

      <div class="flex items-center gap-3">
        <!-- Botón Nuevo Evento -->
        <button @click="() => { selectedEvent = null; isModalOpen = true }"
          class="group flex items-center gap-2 px-3 py-2 text-[#42ABFF] bg-white border border-slate-200 hover:border-[#42ABFF] hover:bg-[#42ABFF]/10 rounded-lg transition-all duration-200 active:scale-95 shadow-sm">
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
            class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span class="hidden md:block text-sm font-semibold">Nuevo</span>
        </button>

        <!-- Botón Agendas -->
        <button @click="cambiarVista"
          class="group flex items-center gap-2 px-3 py-2 text-[#42ABFF] bg-white border border-slate-200 hover:border-[#42ABFF] hover:bg-[#42ABFF]/10 rounded-lg transition-all duration-200 active:scale-95 shadow-sm">
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
          </svg>
          <span class="hidden md:block text-sm font-semibold">Agenda</span>
        </button>

        <!-- Botón Cerrar Sesión -->
        <!-- Se cambió p-2 por px-3 py-2 y border transparente para igualar altura física -->
        <button @click="handleLogout" title="Cerrar Sesión"
          class="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent rounded-lg transition-colors duration-200">
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          <span class="hidden md:block text-sm font-medium">Salir</span>
        </button>
      </div>
    </header>

    <main class="flex-grow p-4 overflow-hidden relative bg-white">
      <FullCalendar ref="calendarRef" :options="calendarOptions" class="h-full" />
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
  background-color: #42ABFF !important;
  /* Azul claro institucional */
  border-color: #42ABFF !important;
}

.fc-button-primary.fc-button-active {
  background-color: #2A93E8 !important;
  border-color: #2A93E8 !important;
}

.fc-button-primary:hover {
  background-color: #2A93E8 !important;
  /* Variación un poco más oscura al pasar el mouse */
  border-color: #2A93E8 !important;
}
</style>
