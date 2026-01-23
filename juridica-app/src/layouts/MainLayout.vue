<template>
  <div class="flex h-screen bg-gray-100 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-white flex flex-col transition-all duration-300 shadow-xl">
      <div class="h-16 flex items-center justify-center border-b border-slate-800">
        <h1 class="text-xl font-bold tracking-wider text-blue-400">JURISGESTIÓN</h1>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2">
        <router-link to="/"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-slate-800"
          active-class="bg-blue-600 text-white shadow-md">
          <LayoutDashboard class="w-5 h-5" />
          <span class="font-medium">Tablero</span>
        </router-link>

        <router-link to="/ingreso"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-200"
          active-class="bg-blue-600 text-white shadow-md">
          <PlusCircle class="w-5 h-5" />
          <span class="font-medium">Nuevo Caso</span>
        </router-link>

        <router-link to="/busqueda"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-200">
          <Search class="w-5 h-5" />
          <span class="font-medium">Búsqueda</span>
        </router-link>

        <router-link to="/reportes"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-200">
          <FileText class="w-5 h-5" />
          <span class="font-medium">Reportes</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-slate-800">
        <button @click="handleLogout"
          class="flex items-center space-x-3 px-4 py-2 w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
          <LogOut class="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="h-16 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200">
        <div class="flex items-center">
          <h2 class="text-2xl font-semibold text-gray-800">{{ $route.meta.title || 'Panel' }}</h2>
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex flex-col items-end">
            <span class="text-sm font-medium text-gray-700">{{ user.nombre_completo }}</span>
            <span class="text-xs text-gray-500">{{ user.rol }}</span>
          </div>
          <div
            class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
            {{ user.iniciales }}
          </div>
        </div>
      </header>

      <!-- View Content -->
      <div class="flex-1 overflow-auto p-8">
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
import { useRouter } from 'vue-router';
import { LayoutDashboard, PlusCircle, Search, FileText, LogOut } from 'lucide-vue-next';
import authService from '../services/auth.service';

const router = useRouter();
const user = ref({ nombre_completo: 'Usuario Sistema', rol: 'Jurídico', iniciales: 'US' });

onMounted(() => {
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    user.value = {
      nombre_completo: currentUser.nombre_completo || currentUser.email,
      rol: currentUser.roles?.[0] || 'Usuario', // Adjust based on your token payload structure
      iniciales: (currentUser.nombre_completo || currentUser.email).substring(0, 2).toUpperCase()
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
