<template>
    <div class="min-h-screen bg-gray-100 flex overflow-hidden">
        <!-- Sidebar / Navegación Lateral -->
        <aside class="bg-blue-900 text-white w-64 flex-shrink-0 flex flex-col hidden md:flex">
            <div
                class="h-16 flex items-center justify-center font-bold text-xl border-b border-blue-800 tracking-wider">
                IMPRESIONES
            </div>
            <nav class="flex-1 py-4 flex flex-col gap-2 px-3">

                <router-link to="/impresiones"
                    class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
                    active-class="bg-blue-800/80 shadow-inner font-semibold" exact>
                    <LayoutDashboardIcon class="w-5 h-5 text-blue-300" />
                    Dashboard
                </router-link>

                <router-link v-if="authStore.hasPermission('impresiones:create')" to="/impresiones/generar"
                    class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
                    active-class="bg-blue-800/80 shadow-inner font-semibold">
                    <FileTextIcon class="w-5 h-5 text-blue-300" />
                    Generar Documento
                </router-link>

                <router-link v-if="authStore.hasPermission('impresiones:config')" to="/impresiones/plantillas"
                    class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
                    active-class="bg-blue-800/80 shadow-inner font-semibold">
                    <SettingsIcon class="w-5 h-5 text-blue-300" />
                    Gestión de Plantillas
                </router-link>

            </nav>
            <div class="p-4 border-t border-blue-800">
                <div class="text-sm font-medium truncate mb-4">{{ authStore.user?.nombres }}</div>
                <button @click="handleLogout"
                    class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 text-sm font-medium rounded-md transition-colors">
                    <LogOutIcon class="w-4 h-4" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>

        <!-- Contenido Principal -->
        <main class="flex-1 flex flex-col h-screen overflow-hidden">
            <!-- Header Móvil (Opcional, muy básico aquí) -->
            <header class="h-16 bg-white shadow-sm flex items-center justify-between px-6 md:hidden">
                <div class="font-bold text-lg text-blue-900">IMPRESIONES</div>
                <button @click="handleLogout" class="p-2 text-gray-500 hover:text-gray-700">
                    <LogOutIcon class="w-5 h-5" />
                </button>
            </header>

            <!-- Área de Router View -->
            <div class="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                <router-view></router-view>
            </div>
        </main>
    </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth.store';
import { useRouter } from 'vue-router';
import {
    LayoutDashboardIcon,
    FileTextIcon,
    SettingsIcon,
    LogOutIcon
} from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
    authStore.logout();
};
</script>
