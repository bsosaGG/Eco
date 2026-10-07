import authService from '../services/auth.service';
import { PERMISOS } from './permisos';

// Mismo criterio que api/src/services/adquisiciones/domain/visibilidad.js. El API es quien lo hace cumplir;
// esto solo adapta los menús y los textos.
//
//  - Expedientes: cada persona ve los que le corresponden y los que emitió; ven todos el administrador y
//    quien supervisa (auditoría y administración).
//  - Reportes: el administrador y quien tenga una función de gestión del trámite.
const PERMISOS_DE_GESTION = Object.values(PERMISOS).filter(
    (permiso) => permiso !== PERMISOS.READ && permiso !== PERMISOS.CREATE
);

export const puedeVerReportes = () => PERMISOS_DE_GESTION.some((permiso) => authService.hasPermission(permiso));

export const veTodosLosExpedientes = () =>
    authService.hasPermission(PERMISOS.AUDIT) || authService.hasPermission(PERMISOS.CONFIG);

/** Nombre de la bandeja según lo que la persona ve en ella. */
export const tituloBandeja = () => {
    if (veTodosLosExpedientes()) return 'Bandeja';
    return puedeVerReportes() ? 'Mi bandeja' : 'Mis solicitudes';
};
