<template>
    <div class="modal-backdrop fade show" v-if="isOpen"></div>
    <div class="modal fade" :class="{ 'show': isOpen }" :style="{ display: isOpen ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <slot name="header">Título del Modal</slot>
                    </h5>
                    <button type="button" class="btn-close" @click="close"></button>
                </div>
                <div class="modal-body">
                    <slot name="body"></slot>
                </div>
                <!-- CORRECCIÓN: El pie de página solo se muestra si la prop 'hideFooter' no es true -->
                <div class="modal-footer" v-if="!hideFooter">
                    <slot name="footer">
                        <button type="button" class="btn btn-secondary" @click="close">Cerrar</button>
                    </slot>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true,
    },
    // CORRECCIÓN: Nueva prop para controlar la visibilidad del footer
    hideFooter: {
        type: Boolean,
        default: false,
    }
});

const emit = defineEmits(['close']);

const close = () => {
    emit('close');
};

const handleEsc = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.isOpen) {
        close();
    }
};

onMounted(() => {
    document.addEventListener('keydown', handleEsc);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleEsc);
});

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
});
</script>

<style scoped>
.modal.show {
    display: block;
}
</style>