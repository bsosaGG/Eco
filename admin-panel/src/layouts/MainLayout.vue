<template>
    <div class="app-layout">
        <Sidebar />
        <div class="main-content">
            <Header />
            <main class="content-area p-4">
                <RouterView />
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import Header from '@/components/layout/Header.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import { RouterView } from 'vue-router';
</script>

<style scoped>
.app-layout {
    display: grid;
    grid-template-areas: "sidebar main-content";
    grid-template-columns: 280px 1fr;
    /* Ancho de la sidebar y el resto */
    height: 100vh;
}

.main-content {
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-areas:
        "header"
        "content-area";
    overflow-y: auto;
    /* Permite scroll solo en el area de contenido */
}

.content-area {
    grid-area: content-area;
    background-color: #f8f9fa;
    /* Un fondo gris claro */
}
</style>