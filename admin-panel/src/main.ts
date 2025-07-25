import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 1. Importa los estilos de Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// 2. Importa el JavaScript de Bootstrap al final (opcional pero recomendado)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
