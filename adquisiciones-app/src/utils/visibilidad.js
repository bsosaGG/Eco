import authService from '../services/auth.service';
import { PERMISOS } from './permisos';

// Mismo criterio que api/src/services/adquisiciones/domain/visibilidad.js: quien solo emite
// solicitudes (permisos read y create) ve únicamente las suyas; con cualquier función de gestión
// del trámite, o siendo admin, se ven todas. El API es quien lo hace cumplir; esto solo adapta
// los menús y los textos.
const PERMISOS_DE_GESTION = Object.values(PERMISOS).filter(
    (permiso) => permiso !== PERMISOS.READ && permiso !== PERMISOS.CREATE
);

export const puedeVerTodo = () => PERMISOS_DE_GESTION.some((permiso) => authService.hasPermission(permiso));
