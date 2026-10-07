import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import { useAuthStore } from "./stores/auth.store";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount("#app");

// Inicializar autenticación institucional en segundo plano sin bloquear el renderizado inicial
const authStore = useAuthStore(pinia);
authStore.initAuth();

