// Prioridades de campaña (Etapa 2): los cinco pesos deben sumar exactamente 100%.
import { PRIORITY_ITEMS, PRIORITY_PRESETS } from './constants.js';

export const priorityTotal = (weights) =>
    PRIORITY_ITEMS.reduce((sum, { key }) => sum + (Number(weights[key]) || 0), 0);

export const prioritiesValid = (weights) => priorityTotal(weights) === 100;

export function totalMessage(weights) {
    const total = priorityTotal(weights);
    return total === 100
        ? 'Total: 100% ✓ Prioridades listas para guardar.'
        : `Total: ${total}% — ajuste los criterios hasta llegar a 100%.`;
}

/** Pesos y preset guardados en el servidor (o los de "Equilibrada" si no hay). */
export function prioritiesFromApi(saved) {
    const preset = saved?.preset || 'balanced';
    const weights = { ...PRIORITY_PRESETS.balanced.weights, ...(saved?.weights || {}) };
    return { preset, weights };
}
