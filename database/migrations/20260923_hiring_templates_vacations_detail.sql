-- ============================================================================
-- MIGRACIÓN: CONTRATACIÓN DE PERSONAL, PLANTILLAS DOCX Y DETALLE DE VACACIONES
-- Fecha: 2026-09-23
-- Reglas de Negocio Institucionales:
-- 1. Flujo de Contratación: persona -> candidato -> empleado -> contrato
-- 2. Restricción de Contrato Activo Único por Colaborador
-- 3. CUI/DPI único no repetible en el sistema
-- 4. Motor de Plantillas Modificables (.docx) para Impresión
-- ============================================================================

-- 1. Restricción de Un Solo Contrato Activo por Colaborador
CREATE UNIQUE INDEX IF NOT EXISTS idx_relaciones_laborales_un_contrato_activo
ON relaciones_laborales (persona_id)
WHERE estado = 'ACTIVO';

-- 2. Extensión de postulaciones_candidatos para vinculación con persona y contratación
ALTER TABLE postulaciones_candidatos 
  ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES personas(id);

ALTER TABLE postulaciones_candidatos 
  DROP CONSTRAINT IF EXISTS postulaciones_candidatos_estado_check;

ALTER TABLE postulaciones_candidatos 
  ADD CONSTRAINT postulaciones_candidatos_estado_check 
  CHECK (estado IN (
    'POSTULADO', 
    'EN_REVISION', 
    'PRESELECCIONADO', 
    'EVALUADO', 
    'SELECCIONADO', 
    'EN_CONTRATACION', 
    'CONTRATADO', 
    'RECHAZADO'
  ));

-- 3. Tabla de Plantillas Modificables de Documentos (.docx)
CREATE TABLE IF NOT EXISTS plantillas_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(60) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'VACACIONES', 'CONSTANCIA', 'CONTRATO', 'INDUCCION'
    descripcion TEXT,
    archivo_nombre VARCHAR(150) NOT NULL,
    archivo_contenido BYTEA, -- Almacenamiento binario del .docx modificable
    variables_disponibles JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plantillas_codigo ON plantillas_documentos (codigo);
CREATE INDEX IF NOT EXISTS idx_plantillas_tipo ON plantillas_documentos (tipo);

-- 4. Seeders de Metadatos de Plantillas Oficiales
INSERT INTO plantillas_documentos (codigo, nombre, tipo, descripcion, archivo_nombre, variables_disponibles)
VALUES 
(
  'BOLETA_SOLICITUD_VACACIONES',
  'Boleta Oficial de Trámite de Vacaciones',
  'VACACIONES',
  'Formulario para solicitud, cómputo de días hábiles y visto bueno de vacaciones en la SCSPR.',
  'boleta_solicitud_vacaciones.docx',
  '[
    {"tag": "correlativo", "descripcion": "Número correlativo de solicitud"},
    {"tag": "fecha_solicitud", "descripcion": "Fecha de emisión de la solicitud"},
    {"tag": "colaborador_nombre", "descripcion": "Nombres y apellidos completos"},
    {"tag": "cui_dpi", "descripcion": "Código Único de Identificación"},
    {"tag": "renglon_codigo", "descripcion": "Renglón presupuestario (011/022/029)"},
    {"tag": "puesto_funcional", "descripcion": "Puesto desempeñado"},
    {"tag": "unidad_administrativa", "descripcion": "Dirección o unidad de adscripción"},
    {"tag": "fecha_inicio", "descripcion": "Fecha inicial del período solicitado"},
    {"tag": "fecha_fin", "descripcion": "Fecha final del período solicitado"},
    {"tag": "dias_solicitados", "descripcion": "Total de días hábiles calculados"},
    {"tag": "saldo_previo", "descripcion": "Saldo acumulado en Kardex previo"},
    {"tag": "saldo_remanente", "descripcion": "Saldo de días hábiles restantes"},
    {"tag": "motivo", "descripcion": "Justificación de la solicitud"},
    {"tag": "jefe_nombre", "descripcion": "Nombre del Jefe Inmediato autorizador"}
  ]'::jsonb
),
(
  'CONSTANCIA_LABORAL_011_022',
  'Constancia Laboral con Código QR (011 / 022)',
  'CONSTANCIA',
  'Constancia de trabajo e ingresos para trámites bancarios y consulares con validación pública QR.',
  'constancia_laboral_011_022.docx',
  '[
    {"tag": "correlativo", "descripcion": "Correlativo oficial SCSPR-URH-CONST-..."},
    {"tag": "fecha_emision", "descripcion": "Fecha en texto formal de emisión"},
    {"tag": "dirigido_a", "descripcion": "Destinatario del documento"},
    {"tag": "colaborador_nombre", "descripcion": "Nombre completo del colaborador"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI del colaborador"},
    {"tag": "puesto_funcional", "descripcion": "Puesto desempeñado"},
    {"tag": "fecha_ingreso", "descripcion": "Fecha de inicio de relación laboral"},
    {"tag": "salario_letras", "descripcion": "Monto de ingresos en letras"},
    {"tag": "salario_numero", "descripcion": "Monto de ingresos en número Q."},
    {"tag": "hash_verificacion", "descripcion": "Hash criptográfico SHA-256"},
    {"tag": "qr_code", "descripcion": "Imagen del Código QR de validación"}
  ]'::jsonb
),
(
  'CONSTANCIA_SERVICIOS_029',
  'Constancia de Servicios Técnicos y Profesionales (029)',
  'CONSTANCIA',
  'Constancia de honorarios y vigencia contractual para contratistas individuales (sin términos de subordinación laboral).',
  'constancia_servicios_029.docx',
  '[
    {"tag": "correlativo", "descripcion": "Correlativo oficial SCSPR-URH-CONST-..."},
    {"tag": "fecha_emision", "descripcion": "Fecha formal de emisión"},
    {"tag": "dirigido_a", "descripcion": "Destinatario"},
    {"tag": "colaborador_nombre", "descripcion": "Nombre del prestador de servicios"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI"},
    {"tag": "objeto_contrato", "descripcion": "Servicios técnicos o profesionales contratados"},
    {"tag": "honorarios_letras", "descripcion": "Honorarios mensuales en letras"},
    {"tag": "honorarios_numero", "descripcion": "Honorarios mensuales en número Q."},
    {"tag": "vigencia_contrato", "descripcion": "Plazo de vigencia del contrato"},
    {"tag": "hash_verificacion", "descripcion": "Hash criptográfico SHA-256"},
    {"tag": "qr_code", "descripcion": "Imagen del Código QR de validación"}
  ]'::jsonb
),
(
  'MINUTA_CONTRATO_029',
  'Minuta Oficial de Contrato de Servicios (029)',
  'CONTRATO',
  'Contrato de prestación de servicios técnicos y profesionales conforme a la Ley de Contrataciones del Estado.',
  'minuta_contrato_029.docx',
  '[
    {"tag": "numero_contrato", "descripcion": "Número oficial de contrato"},
    {"tag": "contratista_nombre", "descripcion": "Nombre del contratista"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI"},
    {"tag": "nit", "descripcion": "NIT"},
    {"tag": "honorarios_mensuales", "descripcion": "Monto de honorarios"},
    {"tag": "plazo_meses", "descripcion": "Vigencia en meses"},
    {"tag": "objeto_servicios", "descripcion": "Descripción de los servicios a prestar"}
  ]'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  descripcion = EXCLUDED.descripcion,
  archivo_nombre = EXCLUDED.archivo_nombre,
  variables_disponibles = EXCLUDED.variables_disponibles,
  updated_at = CURRENT_TIMESTAMP;
