<template>
  <div class="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <h1 class="text-3xl font-bold !text-slate-800 mb-2">Dashboard</h1>
    <p class="!text-slate-500 mb-8 text-lg">Bienvenido al panel de administración. Seleccione el módulo al que desea
      acceder:</p>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Card Agendas -->
      <router-link v-if="authStore.hasAnyAgendaPermission" to="/agendas/entry"
        class="bg-white overflow-hidden shadow-sm rounded-xl flex items-center p-6 hover:bg-slate-50 hover:shadow-md transition-all border border-slate-200 !no-underline group">
        <div class="flex-shrink-0 bg-indigo-50 rounded-lg p-4 group-hover:bg-indigo-100 transition-colors">
          <svg class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="ml-5">
          <h2 class="text-xl font-bold !text-slate-800 group-hover:!text-indigo-600 transition-colors m-0">Agendas</h2>
          <p class="mt-1 text-sm !text-slate-500 m-0">Gestión de agendas semanales.</p>
        </div>
      </router-link>

      <!-- Card Jurídica -->
      <a v-if="authStore.hasAnyJuridicaPermission" href="/juridica/dashboard"
        class="bg-white overflow-hidden shadow-sm rounded-xl flex items-center p-6 hover:bg-slate-50 hover:shadow-md transition-all border border-slate-200 !no-underline group">
        <div class="flex-shrink-0 bg-blue-50 rounded-lg p-4 group-hover:bg-blue-100 transition-colors">
          <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <div class="ml-5">
          <h2 class="text-xl font-bold !text-slate-800 group-hover:!text-blue-600 transition-colors m-0">Dirección
            Jurídica</h2>
          <p class="mt-1 text-sm !text-slate-500 m-0">Gestión de expedientes y juicios.</p>
        </div>
      </a>

      <!-- Card Impresiones -->
      <a v-if="authStore.hasAnyImpresionesPermission" href="/impresiones/generar"
        class="bg-white overflow-hidden shadow-sm rounded-xl flex items-center p-6 hover:bg-slate-50 hover:shadow-md transition-all border border-slate-200 !no-underline group">
        <div class="flex-shrink-0 bg-purple-50 rounded-lg p-4 group-hover:bg-purple-100 transition-colors">
          <svg class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </div>
        <div class="ml-5">
          <h2 class="text-xl font-bold !text-slate-800 group-hover:!text-purple-600 transition-colors m-0">Impresiones
          </h2>
          <p class="mt-1 text-sm !text-slate-500 m-0">Gestión y solicitud de impresiones.</p>
        </div>
      </a>

      <!-- Card Correspondencia -->
      <a v-if="authStore.hasAnyCorrespondenciaPermission" href="/correspondencia/generar"
        class="bg-white overflow-hidden shadow-sm rounded-xl flex items-center p-6 hover:bg-slate-50 hover:shadow-md transition-all border border-slate-200 !no-underline group">
        <div class="flex-shrink-0 bg-green-50 rounded-lg p-4 group-hover:bg-green-100 transition-colors">
          <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="ml-5">
          <h2 class="text-xl font-bold !text-slate-800 group-hover:!text-green-600 transition-colors m-0">Correspondencia
          </h2>
          <p class="mt-1 text-sm !text-slate-500 m-0">Gestión y envío de correspondencia.</p>
        </div>
      </a>

<!-- Card Transportes -->
      <a v-if="authStore.hasAnyTransportesPermission" href="/transportes" class="bg-white overflow-hidden shadow-sm rounded-xl flex items-center p-6 hover:bg-slate-50 hover:shadow-md transition-all border border-slate-200 !no-underline group">
        <div class="flex-shrink-0 bg-emerald-50 rounded-lg p-4 group-hover:bg-emerald-100 transition-colors">
          <!-- Icono de camión / vehículo de Heroicons -->
          <svg class="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
        <div class="ml-5">
          <h2 class="text-xl font-bold !text-slate-800 group-hover:!text-emerald-600 transition-colors m-0">Transportes</h2>
          <p class="mt-1 text-sm !text-slate-500 m-0">Gestión de solicitudes de transporte.</p>
        </div>
      </a>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
</script>