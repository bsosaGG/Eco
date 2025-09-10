<template>
    <div class="container-fluid mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Dashboard de Monitoreo</h1>
            <div class="d-flex gap-2">
                <button class="btn btn-primary" @click="openAddSiteModal"><i class="bi bi-plus-circle me-2"></i>Añadir
                    Sitio</button>
                <button class="btn btn-secondary" @click="openAddServerModal"><i
                        class="bi bi-plus-circle me-2"></i>Añadir Servidor</button>
            </div>
        </div>

        <div v-if="monitoringStore.isLoading && !monitoringStore.servers.length" class="text-center mt-5">
            <div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div>
            <p class="mt-2">Cargando datos...</p>
        </div>
        <div v-else-if="monitoringStore.error" class="alert alert-danger"><strong>Error:</strong> {{
            monitoringStore.error }}</div>
        <div v-else>
            <section class="mb-5">
                <h2><i class="bi bi-hdd-stack-fill me-2"></i>Servidores</h2>
                <hr>
                <div v-if="monitoringStore.servers.length" class="row g-4">
                    <div v-for="server in monitoringStore.servers" :key="server.id_servidor"
                        class="col-12 col-md-6 col-lg-4 col-xl-3">
                        <ServerStatusCard :server="server" @edit="handleEditServer" @delete="handleDeleteServer" />
                    </div>
                </div>
                <div v-else class="alert alert-info">No hay servidores para monitorear.</div>
            </section>
            <section>
                <h2><i class="bi bi-globe-americas me-2"></i>Sitios Web</h2>
                <hr>
                <div v-if="monitoringStore.sites.length" class="row g-4">
                    <div v-for="site in monitoringStore.sites" :key="site.id_sitio_web"
                        class="col-12 col-md-6 col-lg-4 col-xl-3">
                        <SiteStatusCard :site="site" @edit="handleEditSite" @delete="handleDeleteSite" />
                    </div>
                </div>
                <div v-else class="alert alert-info">No hay sitios web para monitorear.</div>
            </section>
        </div>
    </div>

    <BaseModal :is-open="isServerModalOpen" @close="closeServerModal"><template #header>{{ serverModalTitle
            }}</template><template #body>
            <ServerForm v-if="isServerModalOpen" :initial-data="serverToEdit" @submit="handleServerSubmit"
                @cancel="closeServerModal" :is-submitting="isSubmitting" />
        </template><template #footer></template></BaseModal>

    <BaseModal :is-open="isSiteModalOpen" @close="closeSiteModal"><template #header>{{ siteModalTitle
            }}</template><template #body>
            <SiteForm v-if="isSiteModalOpen" :servers="monitoringStore.servers" :initial-data="siteToEdit"
                @submit="handleSiteSubmit" @cancel="closeSiteModal" :is-submitting="isSubmitting" />
        </template><template #footer></template></BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMonitoringStore, type Server, type Site } from '@/stores/monitoring.store';
import ServerStatusCard from '@/components/monitoring/ServerStatusCard.vue';
import SiteStatusCard from '@/components/monitoring/SiteStatusCard.vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import ServerForm from '@/components/monitoring/ServerForm.vue';
import SiteForm from '@/components/monitoring/SiteForm.vue';

const monitoringStore = useMonitoringStore();
let listIntervalId: number | null = null;

// --- Lógica para Servidores ---
const isServerModalOpen = ref(false);
const serverToEdit = ref<Server | null>(null);
const isSubmitting = ref(false);
const serverModalTitle = computed(() => serverToEdit.value ? 'Editar Servidor' : 'Añadir Nuevo Servidor');
const openAddServerModal = () => { serverToEdit.value = null; isServerModalOpen.value = true; };
const closeServerModal = () => { isServerModalOpen.value = false; serverToEdit.value = null; };
const handleEditServer = (server: Server) => { serverToEdit.value = { ...server }; isServerModalOpen.value = true; };
const handleDeleteServer = async (server: Server) => { if (window.confirm(`¿Seguro que quieres eliminar "${server.nombre}"?`)) { try { await monitoringStore.deleteServer(server.id_servidor); } catch (error) { alert(`Error: ${monitoringStore.error}`); } } };
const handleServerSubmit = async (formData: Server) => { isSubmitting.value = true; try { if (serverToEdit.value) { await monitoringStore.updateServer(serverToEdit.value.id_servidor, formData); } else { await monitoringStore.addServer(formData); } closeServerModal(); } catch (error) { alert(`Error: ${monitoringStore.error}`); } finally { isSubmitting.value = false; } };

// --- Lógica para Sitios Web ---
const isSiteModalOpen = ref(false);
const siteToEdit = ref<Site | null>(null);
const siteModalTitle = computed(() => siteToEdit.value ? 'Editar Sitio Web' : 'Añadir Nuevo Sitio');
const openAddSiteModal = () => { siteToEdit.value = null; isSiteModalOpen.value = true; };
const closeSiteModal = () => { isSiteModalOpen.value = false; siteToEdit.value = null; };
const handleEditSite = (site: Site) => { siteToEdit.value = { ...site }; isSiteModalOpen.value = true; };
const handleDeleteSite = async (site: Site) => { if (window.confirm(`¿Seguro que quieres eliminar "${site.nombre}"?`)) { try { await monitoringStore.deleteSite(site.id_sitio_web); } catch (error) { alert(`Error: ${monitoringStore.error}`); } } };
const handleSiteSubmit = async (formData: Site) => { isSubmitting.value = true; try { if (siteToEdit.value) { await monitoringStore.updateSite(siteToEdit.value.id_sitio_web, formData); } else { await monitoringStore.addSite(formData); } closeSiteModal(); } catch (error) { alert(`Error: ${monitoringStore.error}`); } finally { isSubmitting.value = false; } };

onMounted(() => { monitoringStore.fetchDashboardData(); listIntervalId = window.setInterval(() => { monitoringStore.fetchDashboardData(); }, 60000); });
onUnmounted(() => { if (listIntervalId) { clearInterval(listIntervalId); } });
</script>