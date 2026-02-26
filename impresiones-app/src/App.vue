<script setup>
import { useAuthStore } from './stores/auth.store'

const authStore = useAuthStore()

// Se llama antes de montar la app para verificar si hay sesión activa en localStorage
authStore.checkAuth()
</script>

<template>
  <router-view></router-view>
</template>

<style>
/* Estilos globales */
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
