import { ref } from 'vue';

// Estado reactivo global de arrastre compartido entre organigram.view y los nodos del organigrama
const draggedItem = ref(null);

export function useOrganigramDrag() {
  const setDraggedItem = (item) => {
    draggedItem.value = item;
  };

  const clearDraggedItem = () => {
    draggedItem.value = null;
  };

  return {
    draggedItem,
    setDraggedItem,
    clearDraggedItem,
  };
}
