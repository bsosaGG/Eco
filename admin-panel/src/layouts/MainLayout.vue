<template>
    <div class="app-layout" :data-sidebar-visible="isSidebarVisible">
        <Sidebar @navigate="handleNavigation" />
        <div class="main-content-wrapper">
            <Header @toggle-sidebar="toggleSidebar" />
            <main class="content-area p-4">
                <RouterView />
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Header from '@/components/layout/Header.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import { RouterView } from 'vue-router';

const isSidebarVisible = ref(true);

const toggleSidebar = () => {
    isSidebarVisible.value = !isSidebarVisible.value;
};

const handleNavigation = () => {
    if (window.innerWidth < 992) {
        isSidebarVisible.value = false;
    }
};

const checkScreenSize = () => {
    isSidebarVisible.value = window.innerWidth >= 992;
};

onMounted(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkScreenSize);
});
</script>

<style scoped>
.app-layout {
    display: flex;
    height: 100vh;
    overflow-x: hidden;
}

/* Usamos el selector de atributo que ahora sí existe en el template */
.app-layout[data-sidebar-visible='false'] :deep(.sidebar) {
    transform: translateX(-100%);
}

.main-content-wrapper {
    flex-grow: 1;
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-areas: "header" "content-area";
    width: 100%;
    overflow-y: auto;
}

.content-area {
    grid-area: content-area;
    background-color: #f8f9fa;
}

/* El Sidebar se posiciona de forma absoluta en pantallas pequeñas para que pueda deslizarse por encima del contenido */
@media (max-width: 991.98px) {
    .app-layout :deep(.sidebar) {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
    }
}
</style>

<style>
/* Estilo global para añadir un overlay oscuro cuando la sidebar está abierta en móvil */
.main-content-wrapper::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1020;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    pointer-events: none;
    /* No interfiere con los clics por defecto */
}

@media (max-width: 991.98px) {

    /* Solo en móvil, cuando la sidebar está visible, mostramos el overlay */
    .app-layout[data-sidebar-visible='true'] .main-content-wrapper::before {
        opacity: 1;
        pointer-events: auto;
        /* Permite que el overlay sea clickeable (para cerrarlo en el futuro, si quisiéramos) */
    }
}
</style>