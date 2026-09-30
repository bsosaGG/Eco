-- ============================================================================
-- SEED OFICIAL COMPLETO: CORE HUMANIS (AUDITADO EN LAS 60 PESTAÑAS Y 228 PERSONAS)
-- Consolidado de ambos archivos raw-data (Julio 2026 y Septiembre 2026)
-- ============================================================================

BEGIN;

-- 1. Unidades Administrativas
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-001', 'ADMINISTRACIÓN FINANCIERA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-002', 'ADQUISICIONES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-003', 'ALERTA ALBA-KENETH') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-004', 'ASESORÍA JURÍDICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-005', 'AUDITORÍA INTERNA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-006', 'COMUNICACIÓN DEPARTAMENTAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-007', 'COMUNICACIÓN DIGITAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-008', 'DESPACHO SUBSECRETARIA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-009', 'DESPACHO SUPERIOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-010', 'DIRECCIÓN GENERAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-011', 'DISEÑO GRÁFICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-012', 'EDICIÓN') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-013', 'FOTOGRAFÍA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-014', 'GUATEMALA TV') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-015', 'INFORMACIÓN PÚBLICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-016', 'INFORMACIÓN Y PRENSA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-017', 'INFORMÁTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-018', 'LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-019', 'MEDIOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-020', 'MONITOREO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-021', 'MONITOREO Y ANÁLISIS DE MEDIOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-022', 'PLANIFICACIÓN') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-023', 'PRODUCCIÓN Y LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-024', 'RECURSOS HUMANOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-025', 'RELACIONES INTERINSTITUCIONALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-026', 'SERVICIOS GENERALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-027', 'TELEVISIÓN') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-028', 'UNIDAD DE GÉNERO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO unidades_administrativas (codigo, nombre) VALUES ('UAD-029', 'UNIDAD DE PROBIDAD') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 2. Puestos Nominales
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-001', 'ANALISTA DE MEDIOS PUBLICITARIOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-002', 'ANALISTA ESPECÍFICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-003', 'ASESOR PROFESIONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-004', 'ASESOR TÉCNICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-005', 'ASESORA PROFESIONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-006', 'ASISTENTE DE RELACIONES INTERINSTITUCIONALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-007', 'ASISTENTE EJECUTIVO DEL DESPACHO SUPERIOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-008', 'ASISTENTE PROFESIONAL III') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-009', 'ASISTENTE PROFESIONAL IV') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-010', 'ASISTENTE TÉCNICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-011', 'CAMARÓGRAFO PROFESIONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-012', 'CONSERJE') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-013', 'CORRECTOR DE TEXTO PERIODÍSTICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-014', 'DIRECTOR EJECUTIVO III') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-015', 'DIRECTOR EJECUTIVO IV') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-016', 'EDITOR DE TELEVISIÓN') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-017', 'JEFE DE DISEÑO GRÁFICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-018', 'JEFE DE FOTOGRAFÍA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-019', 'JEFE DE LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-020', 'JEFE DE MONITOREO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-021', 'JEFE DE PROGRAMACIÓN Y TRANSMISIÓN') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-022', 'JEFE TÉCNICO PROFESIONAL EN INFORMÁTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-023', 'MONITOR DE MEDIOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-024', 'PERIODISTA INSTITUCIONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-025', 'PILOTO II - VEHÍCULOS PESADOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-026', 'PILOTO II VEHÍCULOS PESADOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-027', 'PROFESIONAL II') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-028', 'PROFESIONAL JEFE III') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-029', 'PROFESIONALES INDIVIDUALES EN GENERAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-030', 'SECRETARIA TÉCNICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-031', 'SECRETARIO RELACIONES PÚBLICAS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-032', 'SERVICIOS PROFESIONALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-033', 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-034', 'SERVICIOS TECNICOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-035', 'SERVICIOS TÉCNICOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-036', 'SUBDIRECTOR EJECUTIVO I') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-037', 'SUBDIRECTOR EJECUTIVO II') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-038', 'SUBDIRECTOR EJECUTIVO III') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-039', 'SUBDIRECTOR TÉCNICO III') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-040', 'SUBSECRETARIO RELACIONES PÚBLICAS DE LA PRESIDENCIA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-041', 'SUPERVISOR DE INFORMÁTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-042', 'SUPERVISOR DE LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-043', 'TECNICO EN LOGISTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-044', 'TRABAJADOR OPERATIVO IV') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-045', 'TÉCNICO EN CÁMARA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-046', 'TÉCNICO EN DISEÑO GRÁFICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-047', 'TÉCNICO EN FOTOGRAFÍA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-048', 'TÉCNICO EN INFORMÁTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-049', 'TÉCNICO EN LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-050', 'TÉCNICO EN RADIO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-051', 'TÉCNICO EN SERVICIOS GENERALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-052', 'TÉCNICO REPORTERO REDACTOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_nominales (codigo, nombre) VALUES ('PNOM-053', 'TÉCNICOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 3. Puestos Funcionales
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-001', 'ANALISTA DE MONITOREO DE PERSONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-002', 'ANALISTA DE NÓMINAS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-003', 'ASESOR JURÍDICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-004', 'ASESOR PROFESIONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-005', 'ASESOR TÉCNICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-006', 'ASESORA PROFESIONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-007', 'ASESORA TÉCNICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-008', 'ASISTENTE') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-009', 'ASISTENTE DE ADQUISICIONES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-010', 'ASISTENTE DE MONITOREO DE PERSONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-011', 'ASISTENTE DE PRESUPUESTO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-012', 'ASISTENTE DE RECURSOS HUMANOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-013', 'ASISTENTE TÉCNICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-014', 'ASISTENTE TÉCNICO DE SERVICIOS GENERALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-015', 'AUXILIAR DE INVENTARIOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-016', 'CAMARÓGRAFO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-017', 'CONSERJE') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-018', 'CONTADOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-019', 'COORDINADOR LOGÍSTICO DE EVENTOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-020', 'CORRECTOR DE TEXTO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-021', 'DIRECTOR DE COMUNICACIÓN DEPARTAMENTAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-022', 'DIRECTOR DE INFORMACION Y PRENSA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-023', 'DIRECTOR DE PRODUCCIÓN Y LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-024', 'DIRECTOR GENERAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-025', 'DIRECTORA DE MONITOREO Y ANÁLISIS DE MEDIOS DE COMUNICACIÓN') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-026', 'DIRECTORA DE RELACIONES INTERINSTITUCIONALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-027', 'DISEÑADORA JUNIOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-028', 'EDITOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-029', 'EDITORA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-030', 'ENCARGADA DE ADMISIÓN DE PERSONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-031', 'ENCARGADA DE ALMACÉN') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-032', 'ENCARGADA DE DESARROLLO DE PERSONAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-033', 'ENCARGADA DE INVENTARIOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-034', 'ENCARGADA DE UNIDAD DE GÉNERO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-035', 'ENCARGADA DE UNIDAD DE INFORMACIÓN PÚBLICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-036', 'ENCARGADA DE VIÁTICOS, GASTOS CONEXOS Y RECONOCIMIENTO DE GASTOS POR SERVICIOS PRESTADOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-037', 'ENCARGADA TEMPORAL DE LA ASESORÍA JURÍDICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-038', 'ENCARGADO DE ASUNTOS DE PROBIDAD') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-039', 'ENCARGADO DE NÓMINAS Y PLANILLAS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-040', 'ENCARGADO DE TESORERÍA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-041', 'FOTÓGRAFO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-042', 'INTÉRPRETE DE LENGUA DE SEÑAS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-043', 'JEFA DE MEDIOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-044', 'JEFE DE AUDITORÍA INTERNA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-045', 'JEFE DE DISEÑO GRÁFICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-046', 'JEFE DE EDICIÓN') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-047', 'JEFE DE FOTOGRAFÍA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-048', 'JEFE DE INFORMÁTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-049', 'JEFE DE LA UNIDAD DE LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-050', 'JEFE DE MONITOREO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-051', 'JEFE DE TELEVISIÓN') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-052', 'JEFE DE UNIDAD DE ADMINISTRACIÓN FINANCIERA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-053', 'JEFE DE UNIDAD DE ADQUISICIONES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-054', 'JEFE DE UNIDAD DE PLANIFICACION') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-055', 'JEFE DE UNIDAD DE RECURSOS HUMANOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-056', 'JEFE DE UNIDAD DE SERVICIOS GENERALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-057', 'MENSAJERO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-058', 'MONITOR DE ALERTAS ALBA KENETH') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-059', 'MONITOR DE MEDIOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-060', 'MONITORA DE MEDIOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-061', 'PERIODISTA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-062', 'PILOTO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-063', 'PRESENTADOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-064', 'PROCURADOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-065', 'PROFESIONALES INDIVIDUALES EN GENERAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-066', 'RECEPCIONISTA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-067', 'REPORTERA REDACTORA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-068', 'REPORTERO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-069', 'REPORTERO REDACTOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-070', 'SECRETARIA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-071', 'SECRETARIA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA DE LA REPÚBLICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-072', 'SERVICIOS PROFESIONALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-073', 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-074', 'SERVICIOS TECNICOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-075', 'SERVICIOS TÉCNICOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-076', 'SUBDIRECTOR DE PRODUCCIÓN Y LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-077', 'SUBJEFE DE LA UNIDAD SERVICIOS GENERALES') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-078', 'SUBSECRETARIA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA DE LA REPÚBLICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-079', 'SUPERVISOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-080', 'SUPERVISOR DE LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-081', 'SWITCHER') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-082', 'TECNICO EN LOGISTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-083', 'TÉCNICO') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-084', 'TÉCNICO EN INFORMATICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-085', 'TÉCNICO EN LOGÍSTICA') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-086', 'TÉCNICO REPORTERO REDACTOR') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
INSERT INTO puestos_funcionales (codigo, nombre) VALUES ('PFUN-087', 'TÉCNICOS') ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 4. Personas y Relaciones Laborales / Contratos (228 registros totales)

WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000001', 'ABDI', 'NATANAEL', 'VENTURA', 'COLLADO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0001',
    '2025-05-13'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'EDITOR DE TELEVISIÓN'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'INTÉRPRETE DE LENGUA DE SEÑAS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'GUATEMALA TV'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000002', 'ABDÍAS', 'NOÉ', 'PÉREZ', 'CORZO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0002',
    '2025-01-03'::date,
    14250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE FOTOGRAFÍA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'FOTOGRAFÍA'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000003', 'ABNER', 'VLADIMIR', 'CHÁVEZ', 'ROSALES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0003',
    '2026-08-24'::date,
    14000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000004', 'ADRIANA', 'DEL', 'PILAR', 'GUZMÁN ESTRADA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0004',
    '2024-04-22'::date,
    9000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA TÉCNICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MEDIOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000005', 'ADRIANA', 'DOMÍNGUEZ', 'LÓPEZ', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0005',
    '2021-10-29'::date,
    13500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000006', 'ALBA', 'AZUCENA', 'RAMÍREZ', 'MUÑOZ DE DE LEON')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0006',
    '2013-08-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000007', 'ALBA', 'NIDIA', 'URBINA', 'ARANGO DE AQUINO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0007',
    '2019-04-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITOR DE ALERTAS ALBA KENETH'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ALERTA ALBA-KENETH'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000008', 'ALEJANDRA', 'MARÍA', 'TAQUÉ', 'TELLO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0008',
    '2025-03-03'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000009', 'ALEX', 'DANIEL', 'JACINTO', 'CONTRERAS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0009',
    '2024-10-16'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'FOTOGRAFÍA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000010', 'ALEX', 'ROSENDO', 'CAB', 'CUC')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0010',
    '2026-04-07'::date,
    13000.0,
    'INACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'AUDITORÍA INTERNA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000011', 'ALICIA', 'ALVAREZ', 'GIL', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0011',
    '2024-01-01'::date,
    25000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000012', 'ALICIA', 'LORENA', 'MELÉNDEZ', 'SINAÍ DE ROSALES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0012',
    '2026-04-01'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000013', 'ALISON', 'SOFIA', 'ALEJANDRA', 'CALLEJAS CANO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0013',
    '2026-04-20'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000014', 'ALVARO', 'DE', 'JESÚS', 'SÚCHITE INTERIANO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0014',
    '2018-09-10'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'FOTÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'FOTOGRAFÍA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000015', 'ANA', 'CRISTINA', 'PUACJ', 'CUZAL')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0015',
    '2022-10-03'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000016', 'ANA', 'GABRIELA', 'FLORES', 'BARRIOS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0016',
    '2022-07-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000017', 'ANA', 'LUCÍA', 'PONCIANO', 'ESTRADA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0017',
    '2026-05-04'::date,
    17250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'DIRECTOR DE PRODUCCIÓN Y LOGÍSTICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000018', 'ANA', 'MARTÍ', 'SUJEY', 'MÉRIDA LÓPEZ DE CIFUENTES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0018',
    '2026-05-05'::date,
    20625.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO IV'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'DIRECTOR GENERAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DIRECCIÓN GENERAL'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000019', 'ANA', 'REGINA', 'VÁSQUEZ', 'GALICH')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0019',
    '2026-09-01'::date,
    13500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000020', 'ANDERSON', 'ARIEL', 'FLORES', 'LÓPEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0020',
    '2026-08-24'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000021', 'ANDERSON', 'JOSUÉ', 'ALVAREZ', 'SALAZAR')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0021',
    '2023-01-16'::date,
    10250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'JEFE DE PROGRAMACIÓN Y TRANSMISIÓN'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE INFORMÁTICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMÁTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000022', 'ANDREA', 'BEATRIZ', 'GONZÁLEZ', 'VÁSQUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0022',
    '2023-11-02'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'REPORTERO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'GUATEMALA TV'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000023', 'ANDREA', 'BEATRIZ', 'VALDEZ', 'DE LEÓM')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0023',
    '2026-08-24'::date,
    18000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUBSECRETARIA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000024', 'ANDREA', 'CECILIA', 'VELIZ', 'DE PAZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0024',
    '2026-01-04'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUBSECRETARIA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000025', 'ANDREA', 'LUCÍA', 'CASHAJ', 'BARAHONA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0025',
    '2025-07-16'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DISEÑO GRÁFICO'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000026', 'ANGEL', 'RICARDO', 'MORATAYA', 'PACHECO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0026',
    '2024-05-02'::date,
    5250.0,
    'INACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE DE MONITOREO DE PERSONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000027', 'ANGELA', 'ISABEL', 'CASTILLO', 'RODRIGUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0027',
    '2026-03-16'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN LOGÍSTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'RECEPCIONISTA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000028', 'ANGIE', 'JEMIMAH', 'BELÉN', 'ROJAS MUÑOZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0028',
    '2026-05-20'::date,
    13500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000029', 'ASTRID', 'ALEJANDRA', 'ALONSO', 'VILLEDA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0029',
    '2026-01-07'::date,
    10625.0,
    'INACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR EJECUTIVO I'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR JURÍDICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ASESORÍA JURÍDICA'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000030', 'ASTRID', 'ELIZABETH', 'RODRÍGUEZ', 'MURALLES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0030',
    '2025-02-17'::date,
    5950.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PROFESIONAL II'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADA DE DESARROLLO DE PERSONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000031', 'ASTRID', 'PAOLA', 'GONZÁLEZ', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0031',
    '2024-02-16'::date,
    12500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA TÉCNICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'GUATEMALA TV'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000032', 'BLANCA', 'FABIOLA', 'ALFARO', 'AVILA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0032',
    '2026-08-06'::date,
    16000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ASESORÍA JURÍDICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000033', 'BRANDON', 'EDUARDO', 'ESCOBAR', 'GONZÁLEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0033',
    '2023-08-17'::date,
    4227.05,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PILOTO II - VEHÍCULOS PESADOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CONSERJE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000034', 'BRANDON', 'EMANUEL', 'SANTIZO', 'LÓPEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0034',
    '2024-01-02'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN INFORMÁTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMÁTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000035', 'BRAYAN', 'LISNOEL', 'MARROQUÍN', 'RIVERA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0035',
    '2026-02-16'::date,
    16000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000036', 'BRENDA', 'NATALÍ', 'LARIOS', 'SOLÓRZANO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0036',
    '2013-08-01'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'REPORTERA REDACTORA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN Y PRENSA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000037', 'BRYAN', 'JOSHUÁ', 'MIGUEL', 'LOL OVALLE')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0037',
    '2026-05-05'::date,
    10625.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR EJECUTIVO I'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SUBJEFE DE LA UNIDAD SERVICIOS GENERALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000038', 'BRYAN', 'JURANDIR', 'BLANCO', 'GÓMEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0038',
    '2023-04-17'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN LOGÍSTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000039', 'BYRON', 'ANTONIO', 'DE', 'LA CRUZ MILIÁN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0039',
    '2026-06-08'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DEPARTAMENTAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000040', 'CARLOS', 'ALBERTO', 'AGUILAR', 'MARROQUÍN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0040',
    '2024-03-01'::date,
    9000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'FOTOGRAFÍA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000041', 'CARLOS', 'ALBERTO', 'OJEDA', 'MONTERROSO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0041',
    '2025-01-07'::date,
    15625.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE UNIDAD DE ADQUISICIONES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADQUISICIONES'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000042', 'CARLOS', 'AUGUSTO', 'SARCEÑO', 'VELÁSQUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0042',
    '2020-03-16'::date,
    3750.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN SERVICIOS GENERALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MENSAJERO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000043', 'CARLOS', 'EDUARDO', 'CHÁVEZ', 'MÉNDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0043',
    '2025-01-02'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000044', 'CARLOS', 'EDUARDO', 'UMAÑA', 'MATEHO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0044',
    '2016-09-01'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PRESENTADOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'GUATEMALA TV'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000045', 'CARLOS', 'ENRIQUE', 'MONGE', 'JUÁREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0045',
    '2026-06-08'::date,
    14000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DIRECCIÓN GENERAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000046', 'CARLOS', 'HUMBERTO', 'DEL', 'VALLE JUAREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0046',
    '2026-05-04'::date,
    20000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000047', 'CARLOS', 'HUMBERTO', 'HERNÁNDEZ', 'BALÁN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0047',
    '2026-03-02'::date,
    4250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SECRETARIA TÉCNICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000048', 'CARLOS', 'JOSUE', 'CONTRERAS', 'SEGURA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0048',
    '2024-03-01'::date,
    4250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SECRETARIA TÉCNICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000049', 'CARLOS', 'MIGUEL', 'ALBERTO', 'ESPINOZA CARRANZA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0049',
    '2024-10-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SWITCHER'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000050', 'CECILIA', 'FERNANDA', 'MORALES', 'LEMUS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0050',
    '2025-11-19'::date,
    35398.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBSECRETARIO RELACIONES PÚBLICAS DE LA PRESIDENCIA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SUBSECRETARIA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA DE LA REPÚBLICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUBSECRETARIA'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000051', 'CELIA', 'PATRICIA', 'MANCILLA', 'MARROQUÍN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0051',
    '2024-01-03'::date,
    12500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA TÉCNICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RELACIONES INTERINSTITUCIONALES'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000052', 'CELSO', 'ANTONIO', 'SANTIZO', 'PÉREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0052',
    '2022-01-03'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000053', 'CINDY', 'ADAMARIS', 'ALONZO', 'PAMAL')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0053',
    '2023-04-17'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE DE RELACIONES INTERINSTITUCIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'REPORTERA REDACTORA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN Y PRENSA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000054', 'CINDY', 'ESTEFANÍA', 'BOCEL', 'TOL')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0054',
    '2026-05-04'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADA DE UNIDAD DE GÉNERO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'UNIDAD DE GÉNERO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000055', 'CRISTIAN', 'SAMUEL', 'MORALES', 'SIRIN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0055',
    '2025-09-19'::date,
    10000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADMINISTRACIÓN FINANCIERA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000056', 'CRYSTIAN', 'EMANUEL', 'URIZAR', 'RODRIGUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0056',
    '2026-06-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TECNICO EN LOGISTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'TECNICO EN LOGISTICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000057', 'CYNTHIA', 'GABRIELA', 'FLORES', 'RODAS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0057',
    '2025-04-03'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN RADIO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADQUISICIONES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000058', 'CÉSAR', 'ALBERTO', 'MÉNDEZ', 'BELLÓN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0058',
    '2023-07-12'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN CÁMARA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000059', 'DANIEL', 'ISAIAS', 'ZAPETA', 'MARROQUIN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0059',
    '2026-04-09'::date,
    10000.0,
    'INACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADQUISICIONES'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000060', 'DAVID', 'EMMANUEL', 'ALVAREZ', 'MÉNDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0060',
    '2026-05-04'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000061', 'DAYLIN', 'VALESKA', 'LEMUS', 'MARTÍNEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0061',
    '2024-08-08'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN DISEÑO GRÁFICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'DISEÑADORA JUNIOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DISEÑO GRÁFICO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000062', 'DENIS', 'EDUARDO', 'ZACARÍAS', 'HERNÁNDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0062',
    '2023-04-12'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN LOGÍSTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000063', 'DERECK', 'RONALDO', 'ROMERO', 'LUCHA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0063',
    '2020-10-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN CÁMARA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000064', 'DICKÉNS', 'SAÚL', 'ZAMORA', 'PÉREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0064',
    '2023-01-03'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'FOTOGRAFÍA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000065', 'DIEGO', 'GABRIEL', 'SILVA', 'POLANCO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0065',
    '2024-03-07'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'GUATEMALA TV'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000066', 'DONALD', 'OBDULIO', 'MONZÓN', 'RAYMUNDO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0066',
    '2013-08-01'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CORRECTOR DE TEXTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN Y PRENSA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000067', 'DULCE', 'MARÍA', 'DEL', 'CARMEN RIVERA BUISLAY')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0067',
    '2026-05-04'::date,
    14000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RELACIONES INTERINSTITUCIONALES'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000068', 'DÉNNYS', 'EDUARDO', 'MEJÍA', 'BARDALES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0068',
    '2026-01-02'::date,
    28000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000069', 'EDUARDO', 'JAVIER', 'GARCÍA', 'RODRÍGUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0069',
    '2020-11-03'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'EDITOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'EDICIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000070', 'ELDER', 'DANILO', 'PEÑATE', 'GARCÍA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0070',
    '2017-09-01'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'CAMARÓGRAFO PROFESIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000071', 'ELDER', 'OMAR', 'RIVAS', 'ROLDAN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0071',
    '2026-01-04'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000072', 'ELIDA', 'JOSEFA', 'PÉREZ', 'RIVERA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0072',
    '2025-10-06'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ALERTA ALBA-KENETH'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000073', 'ELMER', 'ANTONIO', 'CHAJÓN', 'CHACÓN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0073',
    '2025-06-02'::date,
    0.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ANALISTA DE MEDIOS PUBLICITARIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE DE PRESUPUESTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADMINISTRACIÓN FINANCIERA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000074', 'ELSA', 'LISSETTE', 'GUZMÁN', 'HERNÁNDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0074',
    '2025-07-01'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASESOR PROFESIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ASESORÍA JURÍDICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000075', 'ENRIQUE', 'CAÑO', 'MORALES', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0075',
    '2023-05-02'::date,
    4227.05,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'CONSERJE'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CONSERJE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000076', 'ERVIN', 'ALFONSO', 'ALARCÓN', 'ROLDÁN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0076',
    '2026-08-05'::date,
    0.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'CONSERJE'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CONSERJE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000077', 'ERWIN', 'JOSÉ', 'GONZÁLEZ', 'LÓPEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0077',
    '2025-02-17'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN LOGÍSTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'TÉCNICO EN LOGÍSTICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000078', 'ESLENY', 'CECILIA', 'LÓPEZ', 'BARRERA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0078',
    '2025-07-16'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'AUDITORÍA INTERNA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000079', 'ESTUARDO', 'JACOB', 'RECANCOJ', 'MEJÍA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0079',
    '2022-06-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN INFORMÁTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMÁTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000080', 'EUGENIA', 'ELIZABETH', 'SILVA', 'RODAS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0080',
    '2026-02-16'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE DE RECURSOS HUMANOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000081', 'FELIPE', 'JOSÉ', 'GALICIA', 'AMAYA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0081',
    '2026-08-24'::date,
    13500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000082', 'FERNANDO', 'IXBALANQUÉ', 'FRANCISCO', 'RODRÍGUEZ SAQUIC')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0082',
    '2026-05-20'::date,
    13500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DISEÑO GRÁFICO'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000083', 'FRANCISCO', 'ANTONIO', 'SOTO', 'PEREIRA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0083',
    '2024-10-01'::date,
    9850.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR EJECUTIVO II'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE EDICIÓN'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'EDICIÓN'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000084', 'FRANCISCO', 'JAVIER', 'GARCÍA', 'ALVARADO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0084',
    '2020-02-21'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000085', 'FRANK', 'WILLIAM', 'SALAZAR', 'ROGEL')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0085',
    '2020-03-02'::date,
    7009.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'JEFE TÉCNICO PROFESIONAL EN INFORMÁTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMÁTICA'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000086', 'FREDY', 'MARTÍN', 'PUAC', 'MÉNDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0086',
    '2024-07-04'::date,
    13000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'GUATEMALA TV'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000087', 'GABRIELA', 'MARÍA', 'MORALES', 'ARCHILA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0087',
    '2026-04-22'::date,
    17250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'DIRECTOR DE COMUNICACIÓN DEPARTAMENTAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DEPARTAMENTAL'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000088', 'GERARDO', 'EDMUNDO', 'GEREDA', 'GONZÁLEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0088',
    '2023-01-03'::date,
    13000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MEDIOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000089', 'GILBER', 'ANTONIO', 'GARCÍA', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0089',
    '2021-01-04'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'FOTÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'FOTOGRAFÍA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000090', 'GILDA', 'BETSABÉ', 'GONZÁLEZ', 'LÓPEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0090',
    '2022-05-18'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA TÉCNICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO Y ANÁLISIS DE MEDIOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000091', 'GLADYS', 'CONSUELO', 'RAMÍREZ', 'TZIAN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0091',
    '2026-01-04'::date,
    20000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000092', 'GUILLERMO', 'ISAÍ', 'RAMÍREZ', 'REYES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0092',
    '2023-05-02'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000093', 'HAMILTON', 'FERNANDO', 'PATZAN', 'CHANG')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0093',
    '2014-08-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN CÁMARA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000094', 'HEDU', 'JHOSIMAR', 'DE', 'LEÓN GONZÁLEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0094',
    '2026-05-04'::date,
    4148.8,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PILOTO II VEHÍCULOS PESADOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000095', 'HEYDI', 'VANESSA', 'PINEDA', 'ASTORGA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0095',
    '2022-02-16'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITOR DE ALERTAS ALBA KENETH'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ALERTA ALBA-KENETH'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000096', 'HUGO', 'EDUARDO', 'AGUSTÍN', 'RIOS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0096',
    '2017-06-01'::date,
    9000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'EDICIÓN'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000097', 'HUGO', 'RENÉ', 'CARDONA', 'CORDERO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0097',
    '2026-03-09'::date,
    3943.3,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'CONSERJE'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CONSERJE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000098', 'HÉCTOR', 'GEOVANI', 'GATICA', 'PAZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0098',
    '2025-03-03'::date,
    14000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASESOR TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMÁTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000099', 'HÉCTOR', 'HAROLDO', 'SÁNCHEZ', 'VALENCIA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0099',
    '2026-01-02'::date,
    30000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000100', 'INGA', 'ZARAHÍ', 'MORALES', 'MOLINA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0100',
    '2016-03-01'::date,
    9500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA TÉCNICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000101', 'INGRID', 'ANALY', 'MUÑOZ', 'CIFUENTES DE OVALLE')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0101',
    '2026-02-16'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000102', 'INGRID', 'ESTELA', 'RIVERA', 'ROBLES DE HERRERA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0102',
    '2026-01-20'::date,
    17521.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR TÉCNICO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE UNIDAD DE RECURSOS HUMANOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000103', 'JACKELINE', 'MISHELL', 'MORALES', 'RODAS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0103',
    '2026-04-01'::date,
    8500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000104', 'JAIRO', 'DANILO', 'LÓPEZ', 'ENRÍQUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0104',
    '2025-11-04'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ANALISTA DE MEDIOS PUBLICITARIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE DE ADQUISICIONES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADQUISICIONES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000105', 'JANETH', 'GUADALUPE', 'DE', 'JESÚS ALONZO TOC')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0105',
    '2022-02-01'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO Y ANÁLISIS DE MEDIOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000106', 'JENNIFER', 'PAOLA', 'AGUILAR', 'REYES DE BOCALETTI')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0106',
    '2026-04-16'::date,
    17625.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'DIRECTORA DE RELACIONES INTERINSTITUCIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RELACIONES INTERINSTITUCIONALES'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000107', 'JENNIFER', 'PAOLA', 'CORADO', 'CORADO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0107',
    '2026-04-17'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000108', 'JENNYFER', 'LIZETH', 'HERNÁNDEZ', 'ESCOBAR')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0108',
    '2026-09-01'::date,
    22000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000109', 'JESSICA', 'MICHELLE', 'LIMA', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0109',
    '2025-10-08'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000110', 'JOEL', 'DE', 'JESUS', 'ESPAÑA MIGUEL')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0110',
    '2007-03-05'::date,
    5441.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE PROFESIONAL IV'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MENSAJERO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000111', 'JORGE', 'EDUARDO', 'ANDREU', 'MATHEU')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0111',
    '2025-09-19'::date,
    14000.0,
    'INACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DIRECCIÓN GENERAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000112', 'JORGE', 'ERNESTO', 'AROCH', 'RODRÍGUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0112',
    '2026-03-02'::date,
    4250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SECRETARIA TÉCNICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000113', 'JOSE', 'ROBERTO', 'CAAL', 'CONTRERAS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0113',
    '2023-01-03'::date,
    13000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MEDIOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000114', 'JOSUE', 'ALEXANDER', 'ORDOÑEZ', 'ROSALES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0114',
    '2026-03-02'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000115', 'JOSUE', 'DAVID', 'ACEVEDO', 'RIVAS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0115',
    '2023-01-03'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN Y PRENSA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000116', 'JOSÉ', 'ALEXANDER', 'MEZA', 'CATALÁN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0116',
    '2024-07-02'::date,
    10000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASESOR TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADQUISICIONES'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000117', 'JOSÉ', 'ANTONIO', 'ORELLANA', 'LIMA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0117',
    '2023-01-03'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'CAMARÓGRAFO PROFESIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SWITCHER'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000118', 'JOSÉ', 'CARLOS', 'RIVAS', 'GARCÍA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0118',
    '2024-11-04'::date,
    9000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DISEÑO GRÁFICO'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000119', 'JOSÉ', 'DANIEL', 'ACUÑA', 'CHINCHILLA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0119',
    '2022-09-08'::date,
    17000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMÁTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000120', 'JOSÉ', 'GUILLERMO', 'SOLORZANO', 'JUÁREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0120',
    '2026-05-04'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000121', 'JOSÉ', 'LUIS', 'BOLAÑOS', 'HERNÁNDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0121',
    '2026-06-01'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUPERVISOR DE LOGÍSTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SUPERVISOR DE LOGÍSTICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000122', 'JOSÉ', 'PABLO', 'CIFUENTES', 'PEÑA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0122',
    '2026-08-04'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ANALISTA DE MONITOREO DE PERSONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000123', 'JOSÉ', 'PABLO', 'COY', 'LORENZO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0123',
    '2026-03-03'::date,
    4148.8,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PILOTO II VEHÍCULOS PESADOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000124', 'JOSÉ', 'PABLO', 'HERNÁNDEZ', 'ORTIZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0124',
    '2026-05-04'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUPERVISOR DE LOGÍSTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'TÉCNICO EN INFORMATICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMÁTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000125', 'JOSÉ', 'RENÉ', 'ZEPEDA', 'SANTOS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0125',
    '2026-03-02'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN FOTOGRAFÍA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000126', 'JUAN', 'CARLOS', 'EZEQUIEL', 'ALONZO PONCIANO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0126',
    '2026-06-16'::date,
    9000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR EJECUTIVO II'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADO DE NÓMINAS Y PLANILLAS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000127', 'JUAN', 'CRISTÓBAL', 'TZUN', 'REYNOSO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0127',
    '2025-07-04'::date,
    17687.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE UNIDAD DE ADMINISTRACIÓN FINANCIERA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADMINISTRACIÓN FINANCIERA'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000128', 'JUAN', 'DIEGO', 'BRÁN', 'MUÑOZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0128',
    '2026-05-20'::date,
    13500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000129', 'JUAN', 'JOSÉ', 'YUPE', 'GÁLVEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0129',
    '2022-02-16'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUPERVISOR DE LOGÍSTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SUPERVISOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000130', 'JUAN', 'PABLO', 'ROSALES', 'GODOY')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0130',
    '2024-02-16'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMÁTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000131', 'JULIO', 'ALBERTO', 'CANCINOS', 'CIFUENTES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0131',
    '2025-12-01'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000132', 'JULIO', 'ALBERTO', 'MOREIRA', 'CARRILLO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0132',
    '2024-10-01'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CONTADOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADMINISTRACIÓN FINANCIERA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000133', 'JULIO', 'ALEXIS', 'LEÓN', 'RODRÍGUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0133',
    '2024-07-02'::date,
    7250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR EJECUTIVO II'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE TELEVISIÓN'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000134', 'JULIO', 'ALFREDO', 'LÓPEZ', 'LÓPEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0134',
    '2023-05-02'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'EDITOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'EDICIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000135', 'JULIO', 'CÉSAR', 'REYES', 'LÓPEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0135',
    '2024-04-16'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SWITCHER'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000136', 'JULIO', 'FEDERICO', 'LARA', 'GARCÍA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0136',
    '2016-03-01'::date,
    16000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RELACIONES INTERINSTITUCIONALES'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000137', 'JULIO', 'FELIPE', 'ITZEP', 'MORALES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0137',
    '2021-01-04'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'EDITOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN Y PRENSA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000138', 'JULIO', 'FERNANDO', 'ANDRINO', 'BARRIENTOS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0138',
    '2005-08-16'::date,
    5741.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE PROFESIONAL IV'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000139', 'JULIO', 'RAMIRO', 'SOSA', 'MARROQUIN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0139',
    '2026-04-10'::date,
    17775.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'DIRECTOR DE INFORMACION Y PRENSA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN Y PRENSA'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000140', 'JULIO', 'ROBERTO', 'CASTILLO', 'ROSALES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0140',
    '2010-04-16'::date,
    6409.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'JEFE TÉCNICO PROFESIONAL EN INFORMÁTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE TÉCNICO DE SERVICIOS GENERALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000141', 'JULIO', 'RODRIGO', 'REINOSO', 'CALDERÓN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0141',
    '2016-07-04'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'CAMARÓGRAFO PROFESIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SWITCHER'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000142', 'KAREN', 'ZURICZA', 'GARCÍA', 'MOTTA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0142',
    '2025-10-08'::date,
    13000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000143', 'KARINA', 'JUDITH', 'GARCÍA', 'RUANO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0143',
    '2025-11-17'::date,
    51625.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SECRETARIO RELACIONES PÚBLICAS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SECRETARIA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA DE LA REPÚBLICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000144', 'KARLA', 'MARIELA', 'BARRIOS', 'MARROQUÍN DE CANASTUJ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0144',
    '2025-10-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE DE ADQUISICIONES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADQUISICIONES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000145', 'KATHERIN', 'MELISSA', 'ESPAÑA', 'HERRERA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0145',
    '2024-06-03'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ASESORÍA JURÍDICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000146', 'KEREN', 'EDITH', 'VILLATORO', 'GARCÍA DE CISNEROS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0146',
    '2021-06-15'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PLANIFICACIÓN'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000147', 'KEVIN', 'ANDRÉS', 'MORALES', 'HURTARTE')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0147',
    '2022-02-16'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'REPORTERO REDACTOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'GUATEMALA TV'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000148', 'KEVIN', 'MONTES', 'CARDONA', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0148',
    '2026-02-02'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ANALISTA ESPECÍFICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PROCURADOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ASESORÍA JURÍDICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000149', 'LANDER', 'LEONEL', 'ESTRADA', 'GARCÍA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0149',
    '2024-06-04'::date,
    18000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DISEÑO GRÁFICO'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000150', 'LAURA', 'CAROLINA', 'DEL', 'CID GUTIÉRREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0150',
    '2025-09-01'::date,
    10500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA TÉCNICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000151', 'LEYDY', 'JOSIVEL', 'HERRERA', 'MONTERROSO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0151',
    '2025-09-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITOR DE ALERTAS ALBA KENETH'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ALERTA ALBA-KENETH'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000152', 'LILIAN', 'LISBETH', 'HERNÁNDEZ', 'RODRÍGUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0152',
    '2021-10-29'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA TÉCNICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'GUATEMALA TV'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000153', 'LINCY', 'SUCELY', 'RODRÍGUEZ', 'GARCÍA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0153',
    '2023-10-16'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'EDITORA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN Y PRENSA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000154', 'LUCÍA', 'MARIBEL', 'MONZÓN', 'MONZÓN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0154',
    '2025-07-18'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASESORA PROFESIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000155', 'LUIS', 'ALBERTO', 'AGUIRRE', 'VÁSQUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0155',
    '2025-02-24'::date,
    6874.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PROFESIONAL JEFE III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADO DE TESORERÍA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADMINISTRACIÓN FINANCIERA'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000156', 'LUIS', 'ALBERTO', 'HERNÁNDEZ', 'REINA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0156',
    '2026-01-02'::date,
    9000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000157', 'LUIS', 'ALFREDO', 'GARCIA', 'SEQUEN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0157',
    '2022-02-16'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN CÁMARA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000158', 'LUIS', 'EDUARDO', 'CHINCHILLA', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0158',
    '2026-04-27'::date,
    6499.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PROFESIONAL JEFE III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADO DE ASUNTOS DE PROBIDAD'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'UNIDAD DE PROBIDAD'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000159', 'LUIS', 'FELIPE', 'FUENTES', 'GODÍNEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0159',
    '2023-01-16'::date,
    10250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'JEFE DE MONITOREO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE MONITOREO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000160', 'LUIS', 'GABRIEL', 'BATREZ', 'VENTURA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0160',
    '2017-08-16'::date,
    3750.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN SERVICIOS GENERALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000161', 'LUIS', 'ROLANDO', 'SANCHEZ', 'VALVERTH')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0161',
    '2026-03-03'::date,
    26000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DEPARTAMENTAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000162', 'LUISA', 'DANIELA', 'LAGUARDIA', 'OLIVA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0162',
    '2024-01-01'::date,
    23500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000163', 'MANUEL', 'AROLDO', 'MUÑOZ', 'TEO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0163',
    '2025-01-04'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASESOR PROFESIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PLANIFICACIÓN'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000164', 'MANUEL', 'EDUARDO', 'SECAIDA', 'MONTERROSO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0164',
    '2023-09-06'::date,
    9000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'EDICIÓN'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000165', 'MARCO', 'ELEAZAR', 'RUBIO', 'TRUJILLO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0165',
    '2024-08-20'::date,
    10250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'JEFE DE DISEÑO GRÁFICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE DISEÑO GRÁFICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DISEÑO GRÁFICO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000166', 'MARGARITA', 'DEL', 'PILAR', 'ASENCIO FONSECA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0166',
    '2025-09-19'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE EJECUTIVO DEL DESPACHO SUPERIOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADA DE VIÁTICOS, GASTOS CONEXOS Y RECONOCIMIENTO DE GASTOS POR SERVICIOS PRESTADOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADMINISTRACIÓN FINANCIERA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000167', 'MARIA', 'ALEJANDRA', 'GUZMAN', 'HERNÁNDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0167',
    '2026-03-02'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000168', 'MARIANA', 'ISABEL', 'LÓPEZ', 'ESCOBEDO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0168',
    '2025-02-03'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN Y PRENSA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000169', 'MARIEL', 'JIMENA', 'DE', 'LEÓN BLANCO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0169',
    '2026-07-01'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000170', 'MARIO', 'ANDRES', 'PÉREZ', 'LÓPEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0170',
    '2024-04-01'::date,
    9000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MEDIOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000171', 'MARIO', 'RENÉ', 'DÁVILA', 'HERNÁNDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0171',
    '2013-05-02'::date,
    16046.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR TÉCNICO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE UNIDAD DE SERVICIOS GENERALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000172', 'MARLON', 'ARIEL', 'DE', 'PAZ PRADO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0172',
    '2023-05-02'::date,
    5000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000173', 'MARÍA', 'DE', 'LOS', 'ANGELES SAMAYOA PÉREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0173',
    '2025-09-01'::date,
    0.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA TÉCNICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RELACIONES INTERINSTITUCIONALES'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000174', 'MARÍA', 'DEL', 'CARMEN', 'BLANCO ESTRADA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0174',
    '2017-11-16'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000175', 'MARÍA', 'ELIZET', 'ORTÍZ', 'CANO DE CONTRERAS')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0175',
    '2008-09-01'::date,
    3750.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TRABAJADOR OPERATIVO IV'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CONSERJE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000176', 'MARÍA', 'FERNANDA', 'MENDOZA', 'MENDOZA DE GONZALEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0176',
    '2025-10-01'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO Y ANÁLISIS DE MEDIOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000177', 'MARÍA', 'LOURDES', 'HÉRCULES', 'MAGAÑA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0177',
    '2024-01-19'::date,
    30000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000178', 'MIGUEL', 'ANGEL', 'NAVARRO', 'TAQUÉ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0178',
    '2003-03-13'::date,
    5766.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE PROFESIONAL IV'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000179', 'MILDRED', 'ANALY', 'MORALES', 'FLORES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0179',
    '2016-12-01'::date,
    8625.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ANALISTA ESPECÍFICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000180', 'MIRIAM', 'MARIBEL', 'MOLINA', 'MARTINEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0180',
    '2026-04-17'::date,
    15000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUPERIOR'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000181', 'MONICA', 'ALEJANDRA', 'CASTELLANOS', 'MEJÍA DE FUENTES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0181',
    '2024-02-01'::date,
    17250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'DIRECTORA DE MONITOREO Y ANÁLISIS DE MEDIOS DE COMUNICACIÓN'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO Y ANÁLISIS DE MEDIOS'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000182', 'MÓNICA', 'ARACELY', 'CAP', 'CHULUC')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0182',
    '2026-05-20'::date,
    17000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DIRECCIÓN GENERAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000183', 'MÓNICA', 'YANIRA', 'MACARIO', 'VELÁSQUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0183',
    '2021-07-16'::date,
    3750.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE PROFESIONAL III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SECRETARIA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000184', 'NATALI', 'VALERIA', 'JULAJUJ', 'ZELADA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0184',
    '2022-09-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000185', 'NATALY', 'YOHANA', 'OVALLE', 'MENDOZA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0185',
    '2024-10-07'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE EJECUTIVO DEL DESPACHO SUPERIOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADQUISICIONES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000186', 'NELSON', 'GIOVANNI', 'IBOY', 'ROCHE')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0186',
    '2016-07-04'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'CORRECTOR DE TEXTO PERIODÍSTICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'EDITOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'EDICIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000187', 'NELSON', 'MISRAIM', 'GARCÍA', 'CHÚN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0187',
    '2026-03-02'::date,
    3973.05,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN SERVICIOS GENERALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MENSAJERO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000188', 'NOELIA', 'LISSETH', 'MATTA', 'AGUILAR')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0188',
    '2024-09-17'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000189', 'NORA', 'ELIZABETH', 'CHUY', 'GÓMEZ DE CHIPIX')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0189',
    '2025-05-26'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ANALISTA DE NÓMINAS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000190', 'NOÉ', 'MOISÉS', 'MEDINA', 'FRANCO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0190',
    '2020-10-01'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'CAMARÓGRAFO PROFESIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000191', 'OSBERTO', 'ROLANDO', 'MONZÓN', 'GARCÍA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0191',
    '2026-03-02'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO REPORTERO REDACTOR'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'AUXILIAR DE INVENTARIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADMINISTRACIÓN FINANCIERA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000192', 'OSCAR', 'ADELSO', 'HERNÁNDEZ', 'VALLADARES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0192',
    '2026-03-09'::date,
    4148.8,
    'INACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PILOTO II VEHÍCULOS PESADOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000193', 'OSCAR', 'AMILCAR', 'VELAS', 'HERNANDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0193',
    '2026-04-20'::date,
    10250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'JEFE DE FOTOGRAFÍA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE UNIDAD DE PLANIFICACION'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PLANIFICACIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000194', 'OSCAR', 'FERNANDO', 'VASQUEZ', 'TARACENA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0194',
    '2013-10-14'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO Y ANÁLISIS DE MEDIOS'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000195', 'OSCAR', 'LEONEL', 'ALVEÑO', 'GATICA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0195',
    '2015-07-01'::date,
    15250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE LA UNIDAD DE LOGÍSTICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000196', 'OSCAR', 'MANUEL', 'CONTRERAS', 'PÉREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0196',
    '2026-03-02'::date,
    3797.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PILOTO II VEHÍCULOS PESADOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000197', 'PABLO', 'ANDRÉS', 'ALVARADO', 'CASTILLO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0197',
    '2024-02-19'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN CÁMARA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CAMARÓGRAFO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'TELEVISIÓN'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000198', 'PABLO', 'PALOMO', 'REYNA', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0198',
    '2021-03-01'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PERIODISTA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN Y PRENSA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000199', 'PEDRO', 'ALESSANDRO', 'SARAVIA', 'SOLARES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0199',
    '2009-02-02'::date,
    5175.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE PROFESIONAL III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000200', 'PETER', 'ALEXANDER', 'FLORENCIO', 'BERDÚO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0200',
    '2026-06-24'::date,
    13000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'AUDITORÍA INTERNA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000201', 'RICARDO', 'ANTONIO', 'MARROQUÌN', 'ALVARADO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0201',
    '2024-09-02'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DISEÑO GRÁFICO'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000202', 'RIGOBERTO', 'HERNÁNDEZ', 'HERRERA', '')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0202',
    '2013-08-01'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000203', 'ROBERTO', 'ALEJANDRO', 'VALDÉS', 'ARCE')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0203',
    '2026-06-05'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'TÉCNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000204', 'ROCKSANDA', 'KARIM', 'VIRGINIA', 'ESCOBAR MENDIZÁBAL DE GARCÍA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0204',
    '2026-05-04'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADA DE UNIDAD DE INFORMACIÓN PÚBLICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMACIÓN PÚBLICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000205', 'ROLANDO', 'JOSÉ', 'ROSALES', 'ARRIOLA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0205',
    '2023-04-17'::date,
    6250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUPERVISOR DE INFORMÁTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SUPERVISOR'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'INFORMÁTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000206', 'ROSA', 'VIRGINIA', 'VÁSQUEZ', 'PIXTÚN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0206',
    '2025-04-01'::date,
    8000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASESOR TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADMINISTRACIÓN FINANCIERA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000207', 'SAMUEL', 'ANTONIO', 'NUÑEZ', 'RODRÍGUEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0207',
    '2015-04-01'::date,
    3750.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN SERVICIOS GENERALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MENSAJERO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000208', 'SAMUEL', 'BENJAMÍN', 'RAMÍREZ', 'MORALES')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0208',
    '2026-06-01'::date,
    10250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'JEFE DE LOGÍSTICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'COORDINADOR LOGÍSTICO DE EVENTOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'LOGÍSTICA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000209', 'SHIRLEY', 'ARACELY', 'AJTÚN', 'ARGUETA DE GARCÍA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0209',
    '2026-01-19'::date,
    15625.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFE DE AUDITORÍA INTERNA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'AUDITORÍA INTERNA'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000210', 'SINDY', 'ANALÍ', 'CAMEY', 'DE LEÓN DE GÓMEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0210',
    '2025-07-01'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN FOTOGRAFÍA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'FOTOGRAFÍA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000211', 'SOFÍA', 'MARIELOS', 'ANALI', 'ARREAGA AYAPÁN')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0211',
    '2026-03-02'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SECRETARIA TÉCNICA'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'REPORTERA REDACTORA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'GUATEMALA TV'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000212', 'STEFANY', 'BETZABÉ', 'MORATAYA', 'CHÁVEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '011-2026-0212',
    '2023-03-01'::date,
    5691.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASISTENTE PROFESIONAL IV'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADA DE ALMACÉN'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '011';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000213', 'STEFFANY', 'JOHANA', 'ROSALES', 'GÁMEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0213',
    '2023-02-02'::date,
    5250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'MONITOR DE MEDIOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'MONITORA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000214', 'SUCELY', 'BEATRIZ', 'RODRÍGUEZ', 'GÓMEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0214',
    '2025-06-26'::date,
    7250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR EJECUTIVO II'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASISTENTE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADQUISICIONES'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000215', 'SURAMI', 'TERESITA', 'NAAYDHILI', 'MORALES CASTILLO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0215',
    '2026-05-04'::date,
    14625.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SUBDIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SUBDIRECTOR DE PRODUCCIÓN Y LOGÍSTICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'PRODUCCIÓN Y LOGÍSTICA'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000216', 'VALERIE', 'JAZMÍN', 'DIVAS', 'NAVICHOQUE')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0216',
    '2025-04-01'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PERIODISTA INSTITUCIONAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADA DE INVENTARIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'ADMINISTRACIÓN FINANCIERA'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000217', 'VEYLIN', 'ROCÍO', 'HERRERA', 'AGUILAR')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0217',
    '2022-03-21'::date,
    12500.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TÉCNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESORA TÉCNICA'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000218', 'VICTOR', 'MANUEL', 'MATIAS', 'PÉREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0218',
    '2025-02-17'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ASESOR TÉCNICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR TÉCNICO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RELACIONES INTERINSTITUCIONALES'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000219', 'VÍCTOR', 'MANUEL', 'ARRIVILLAGA', 'ESCOBAR')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0219',
    '2022-08-25'::date,
    14000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DISEÑO GRÁFICO'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000220', 'WALTER', 'AMILCAR', 'AMEZQUITA', 'BENITEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0220',
    '2024-05-02'::date,
    4227.05,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PILOTO II - VEHÍCULOS PESADOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CONSERJE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000221', 'WENDY', 'ELUZAHI', 'PERALTA', 'PINEDA')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '022-2026-0221',
    '2024-03-01'::date,
    13625.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'DIRECTOR EJECUTIVO III'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'JEFA DE MEDIOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MEDIOS'
WHERE r.codigo = '022';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000222', 'WENDY', 'GABRIELA', 'DE', 'PAZ MELÉNDEZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0222',
    '2026-03-19'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DIRECCIÓN GENERAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000223', 'WERNER', 'JOSSÉ', 'WELLMANN', 'SALVADOR')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0223',
    '2026-04-17'::date,
    12000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS TECNICOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS TECNICOS'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'MONITOREO'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000224', 'WILLIAM', 'FERNANDO', 'PAZ', 'ESCOBAR')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '031-2026-0224',
    '2026-06-01'::date,
    4148.8,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'PILOTO II VEHÍCULOS PESADOS'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'PILOTO'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '031';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000225', 'WILLY', 'FERNANDO', 'AGUILAR', 'ROMERO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0225',
    '2024-03-01'::date,
    13000.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES INDIVIDUALES EN GENERAL'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ASESOR PROFESIONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'COMUNICACIÓN DIGITAL'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000226', 'YANY', 'MARÍA', 'BERREONDO', 'ROULET DE PÉREZ')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '029-2026-0226',
    '2025-12-01'::date,
    25000.0,
    'INACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'SERVICIOS PROFESIONALES'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'DESPACHO SUBSECRETARIA'
WHERE r.codigo = '029';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000227', 'ZOILA', 'YOLANDA', 'CAMPOS', 'ROSSI')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0227',
    '2022-02-09'::date,
    8250.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'ANALISTA ESPECÍFICO'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'ENCARGADA DE ADMISIÓN DE PERSONAL'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'RECURSOS HUMANOS'
WHERE r.codigo = '021';


WITH p_ins AS (
    INSERT INTO personas (cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
    VALUES ('2026000000228', 'ZONIA', 'MARGOT', 'FERNANDEZ', 'AQUINO')
    ON CONFLICT (cui_dpi) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
    RETURNING id
)
INSERT INTO relaciones_laborales (
    persona_id,
    renglon_id,
    puesto_nominal_id,
    puesto_funcional_id,
    unidad_admin_id,
    numero_acuerdo_contrato,
    fecha_inicio,
    salario_honorarios,
    estado
)
SELECT 
    p_ins.id,
    r.id,
    pn.id,
    pf.id,
    ua.id,
    '021-2026-0228',
    '2022-02-01'::date,
    3750.0,
    'ACTIVO'
FROM p_ins
CROSS JOIN renglones_presupuestarios r
LEFT JOIN puestos_nominales pn ON pn.nombre = 'TÉCNICO EN SERVICIOS GENERALES'
LEFT JOIN puestos_funcionales pf ON pf.nombre = 'CONSERJE'
LEFT JOIN unidades_administrativas ua ON ua.nombre = 'SERVICIOS GENERALES'
WHERE r.codigo = '021';

COMMIT;