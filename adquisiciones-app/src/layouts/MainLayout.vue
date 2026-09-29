<template>
  <div class="flex h-screen bg-gray-100 font-sans overflow-hidden">
    <!-- Overlay for mobile -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"></div>

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-30 bg-primary text-white flex flex-col transition-all duration-300 transform md:relative md:translate-x-0 shadow-xl"
      :class="[
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        isDesktopSidebarOpen ? 'w-64' : 'w-64 md:w-0 md:overflow-hidden'
      ]">
      <div class="h-16 flex items-center gap-2 justify-center border-b border-white/10 relative px-4">
        <img :src="logo" alt="SCSPR" class="h-8 brightness-0 invert" />
        <span class="text-sm font-bold tracking-wide leading-tight">Adquisiciones</span>
        <button @click="sidebarOpen = false" class="absolute right-4 text-white/60 hover:text-white md:hidden">
          <X class="w-6 h-6" />
        </button>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <router-link to="/dashboard" @click="sidebarOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-white/10"
          active-class="bg-accent text-white shadow-md">
          <LayoutDashboard class="w-5 h-5" />
          <span class="font-medium">Bandeja</span>
        </router-link>

        <router-link v-if="canCreate" to="/expedientes/nuevo" @click="sidebarOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
          active-class="bg-accent text-white shadow-md">
          <PlusCircle class="w-5 h-5" />
          <span class="font-medium">Nueva Solicitud</span>
        </router-link>

        <router-link v-if="canConfig" to="/proveedores" @click="sidebarOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
          active-class="bg-accent text-white shadow-md">
          <Truck class="w-5 h-5" />
          <span class="font-medium">Proveedores</span>
        </router-link>

        <router-link v-if="canConfig" to="/unidades" @click="sidebarOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
          active-class="bg-accent text-white shadow-md">
          <Building2 class="w-5 h-5" />
          <span class="font-medium">Unidades Solicitantes</span>
        </router-link>

        <div v-if="canRead" class="pt-4 mt-4 border-t border-white/10 text-xs uppercase tracking-wide text-white/40 px-4">
          Reportes
        </div>

        <router-link v-if="canRead" to="/reportes/cotizaciones" @click="sidebarOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
          active-class="bg-accent text-white shadow-md">
          <Receipt class="w-5 h-5" />
          <span class="font-medium">Cotizaciones</span>
        </router-link>

        <router-link v-if="canRead" to="/reportes/cdp-oc" @click="sidebarOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
          active-class="bg-accent text-white shadow-md">
          <ClipboardList class="w-5 h-5" />
          <span class="font-medium">CDP y Órdenes de Compra</span>
        </router-link>

        <router-link v-if="canRead" to="/reportes/financiera" @click="sidebarOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
          active-class="bg-accent text-white shadow-md">
          <Wallet class="w-5 h-5" />
          <span class="font-medium">Fase Financiera</span>
        </router-link>

        <router-link v-if="canRead" to="/reportes/resumen" @click="sidebarOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
          active-class="bg-accent text-white shadow-md">
          <BarChart3 class="w-5 h-5" />
          <span class="font-medium">Resumen General</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-white/10">
        <button @click="handleLogout"
          class="flex items-center space-x-3 px-4 py-2 w-full rounded-lg text-white/60 hover:text-red-300 hover:bg-white/10 transition-colors">
          <LogOut class="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden w-full relative">
      <!-- Topbar -->
      <header class="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-8 border-b border-gray-200 z-10">
        <div class="flex items-center gap-3">
          <button @click="sidebarOpen = true" class="md:hidden text-gray-600 hover:text-gray-900">
            <Menu class="w-6 h-6" />
          </button>
          <button @click="isDesktopSidebarOpen = !isDesktopSidebarOpen"
            class="hidden md:block text-gray-600 hover:text-accent transition-colors">
            <Menu class="w-6 h-6" />
          </button>
          <h2 class="text-xl md:text-2xl font-semibold text-gray-800 truncate max-w-[200px] md:max-w-none">
            {{ $route.meta.title || 'Panel' }}
          </h2>
        </div>
        <div class="flex items-center space-x-2 md:space-x-4">
          <div class="hidden md:flex flex-col items-end">
            <span class="text-sm font-medium text-gray-700">{{ user.nombre_completo }}</span>
            <span class="text-xs text-gray-500">{{ user.rol }}</span>
          </div>
          <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold border border-blue-200 text-sm md:text-base">
            {{ user.iniciales }}
          </div>
        </div>
      </header>

      <!-- View Content -->
      <div class="flex-1 overflow-auto p-4 md:p-8 relative">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { LayoutDashboard, PlusCircle, Truck, Building2, LogOut, Menu, X, Receipt, ClipboardList, Wallet, BarChart3 } from 'lucide-vue-next';
import authService from '../services/auth.service';
import logo from '../assets/logo-scspr.svg';

const user = ref({ nombre_completo: 'Usuario Sistema', rol: 'Adquisiciones', iniciales: 'US' });
const sidebarOpen = ref(false);
const isDesktopSidebarOpen = ref(true);

const canCreate = authService.hasPermission('adquisiciones:create');
const canConfig = authService.hasPermission('adquisiciones:config');
const canRead = authService.hasPermission('adquisiciones:read');

onMounted(() => {
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    const nombre = currentUser.nombre_completo || currentUser.name || currentUser.email;
    user.value = {
      nombre_completo: nombre,
      rol: currentUser.rol || currentUser.email || 'Usuario',
      iniciales: nombre.substring(0, 2).toUpperCase(),
    };
  }
});

const handleLogout = () => {
  authService.logout();
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
