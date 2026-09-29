-- =========================================================
-- seed_adquisiciones_data.sql
-- Datos DUMMY del módulo de Adquisiciones (SICOMPRAS, Baja Cuantía) en db_adquisiciones_scspr.
--
-- Deja 27 expedientes repartidos en los 11 estados del ciclo de vida, con toda la cadena
-- de objetos coherente para cada etapa (renglones, cotizaciones, CDP, OC, recepción,
-- documentos, compromiso, devengado, solicitud de pago, devoluciones y bitácora).
--
-- NO ejecutar a mano: usar seed_adquisiciones_data.sh, que resuelve los id_usuario reales
-- desde db_global_users (otra base, no se puede consultar desde aquí) y los pasa como
-- variables psql (u_solicitante, u_recepcion, u_analista, u_asistente, u_encargado,
-- u_udaf, u_jefe, u_directora, u_contabilidad, u_subdespacho).
--
-- ⚠ BORRA los datos operativos del módulo (expedientes, cotizaciones, CDP, OC, etc. y
-- usuarios_unidad_solicitante) y reinicia sus secuencias. Conserva los catálogos
-- (unidades, renglones, estados) y proveedores existentes. Solo ambiente de prueba.
-- Es re-ejecutable.
-- =========================================================
\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE _u ON COMMIT DROP AS SELECT
    :u_solicitante::int   AS solicitante,
    :u_recepcion::int     AS recepcion,
    :u_analista::int      AS analista,
    :u_asistente::int     AS asistente,
    :u_encargado::int     AS encargado,
    :u_udaf::int          AS udaf,
    :u_jefe::int          AS jefe,
    :u_directora::int     AS directora,
    :u_contabilidad::int  AS contabilidad,
    :u_subdespacho::int   AS subdespacho;

CREATE FUNCTION pg_temp.h(t text) RETURNS text LANGUAGE sql AS
$$ SELECT encode(sha256(convert_to(t, 'UTF8')), 'hex') $$;

-- ---------------------------------------------------------
-- 0) Limpieza de datos operativos
-- ---------------------------------------------------------
TRUNCATE
    devoluciones_observaciones, bitacora_trazabilidad, solicitudes_pago, devengados,
    compromisos_presupuestarios, documentos_soporte, recepciones, ordenes_compra, cdp,
    cotizaciones, expediente_items, expedientes, usuarios_unidad_solicitante
RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------
-- 1) Catálogos: proveedores y partidas presupuestarias
-- ---------------------------------------------------------
INSERT INTO proveedores (razon_social, nit, constancia_rtu_vigente, email_contacto, telefono, activo) VALUES
    ('Distribuidora Papelera Centroamericana, S.A.',  '1000001-1', TRUE,  'ventas@papelera-ca.example.com',     '2200-1001', TRUE),
    ('Tecnología y Sistemas del Norte, S.A.',         '1000002-2', TRUE,  'cotizaciones@tecnorte.example.com',  '2200-1002', TRUE),
    ('Comercial Ofimática Guatemala, S.A.',           '1000003-3', TRUE,  'ventas@ofimatica-gt.example.com',    '2200-1003', TRUE),
    ('Servicios Integrales Orión, S.A.',              '1000004-4', TRUE,  'contacto@orion-servicios.example.com','2200-1004', TRUE),
    ('Grupo Gráfico Impresores, S.A.',                '1000005-5', TRUE,  'ventas@grupografico.example.com',    '2200-1005', TRUE),
    ('Audiovisuales y Comunicaciones Maya, S.A.',     '1000006-6', TRUE,  'ventas@avmaya.example.com',          '2200-1006', TRUE),
    ('Suministros Industriales del Sur, S.A.',        '1000007-7', FALSE, 'ventas@sindsur.example.com',         '2200-1007', TRUE),
    ('Importadora El Quetzal (inactivo)',             '1000008-8', FALSE, 'info@elquetzal.example.com',         '2200-1008', FALSE)
ON CONFLICT (nit) DO NOTHING;

INSERT INTO partidas_presupuestarias
    (ejercicio_fiscal, programa, actividad, id_renglon, fuente_financiamiento, monto_asignado, monto_disponible)
SELECT 2026, '11', '001', r.id_renglon, '11 - Ingresos Corrientes', v.monto, v.monto
FROM (VALUES
    (121, 100000), (122, 100000), (162,  80000), (165,  60000), (185, 120000),
    (186, 150000), (189, 120000), (241, 120000), (262,  80000), (291, 150000),
    (292,  60000), (297,  60000), (322, 180000), (324, 150000), (326, 150000),
    (328, 200000)
) AS v(num, monto)
JOIN renglones_presupuestarios r ON r.numero_renglon = v.num
ON CONFLICT (ejercicio_fiscal, programa, actividad, id_renglon, fuente_financiamiento) DO NOTHING;

-- Asignaciones usuario <-> unidad (segunda firma de la Solicitud de Compra)
INSERT INTO usuarios_unidad_solicitante (id_usuario, id_unidad_solicitante, cargo)
SELECT v.id_usuario, un.id_unidad, v.cargo
FROM unidades_solicitantes un
CROSS JOIN (
    SELECT solicitante AS id_usuario, 'Solicitante de la unidad' AS cargo FROM _u
    UNION ALL
    SELECT subdespacho, 'Jefe de Unidad' FROM _u
) v;

-- ---------------------------------------------------------
-- 2) Especificación de los 27 expedientes (paso = último paso del proceso alcanzado)
--    1 creada · 2 asignada · 3 cotizaciones · 4 adjudicada · 5 CDP borrador ·
--    6 CDP aprob. técnica · 7 CDP Vo.Bo. UDAF · 8 OC borrador · 9 OC aprob. jefatura ·
--    10 OC emitida · 11 recepción · 12 documentos · 13 traslado a contabilidad ·
--    14 compromiso · 15 devengado · 16 solicitud de pago · 17 pagado y archivado
-- ---------------------------------------------------------
CREATE TEMP TABLE _spec (
    idx int, codigo text, unidad text, tipo text, objeto text, justificacion text,
    paso int, estado text, anexo boolean, items jsonb
) ON COMMIT DROP;

INSERT INTO _spec VALUES
(1,'UL-1-2026','UL','Suministros','Adquisición de papel bond y útiles de oficina para el primer semestre',
 'Reposición de existencias de papelería para las operaciones de la unidad.',
 1,'Recibida por Adquisiciones',FALSE,
 $j$[{"d":"Resma de papel bond carta 75 g","c":60,"u":"Resma","p":39.50,"r":241},
     {"d":"Caja de folders manila tamaño carta","c":15,"u":"Caja","p":62.00,"r":291},
     {"d":"Caja de lapiceros azules","c":20,"u":"Caja","p":48.00,"r":291}]$j$),
(2,'UT-1-2026','UT','Equipo','Adquisición de cámaras de video para cobertura de eventos',
 'Las cámaras actuales cumplieron su vida útil y no soportan grabación en 4K.',
 1,'Recibida por Adquisiciones',TRUE,
 $j$[{"d":"Cámara de video 4K profesional","c":2,"u":"Unidad","p":24500.00,"r":326},
     {"d":"Trípode profesional para video","c":2,"u":"Unidad","p":2150.00,"r":326},
     {"d":"Tarjeta de memoria SD 128 GB","c":6,"u":"Unidad","p":265.00,"r":328}]$j$),
(3,'UM-1-2026','UM','Servicios','Servicio de monitoreo de medios digitales por tres meses',
 'Se requiere monitoreo continuo de medios para el análisis de la agenda informativa.',
 1,'Recibida por Adquisiciones',FALSE,
 $j$[{"d":"Servicio mensual de monitoreo de medios digitales","c":3,"u":"Mes","p":12500.00,"r":189}]$j$),
(4,'DIP-1-2026','DIP','Materiales','Impresión de material informativo institucional',
 'Material de apoyo para las jornadas de divulgación del segundo trimestre.',
 2,'Pendiente Cotización',FALSE,
 $j$[{"d":"Trifoliares full color","c":2000,"u":"Unidad","p":3.25,"r":122},
     {"d":"Afiches tamaño tabloide","c":500,"u":"Unidad","p":8.00,"r":122},
     {"d":"Banner roll-up con estructura","c":4,"u":"Unidad","p":850.00,"r":122}]$j$),
(5,'UI-1-2026','UI','Equipo','Switches administrables para la red interna',
 'Ampliación de puertos para nuevas estaciones de trabajo; la red actual está saturada.',
 3,'Pendiente Cotización',FALSE,
 $j$[{"d":"Switch administrable 24 puertos gigabit PoE","c":3,"u":"Unidad","p":8900.00,"r":326},
     {"d":"Rack de pared 12U","c":1,"u":"Unidad","p":4200.00,"r":326}]$j$),
(6,'USG-1-2026','USG','Servicios','Mantenimiento preventivo de aires acondicionados',
 'Mantenimiento semestral para evitar fallas en las áreas de servidores y producción.',
 3,'Pendiente Cotización',FALSE,
 $j$[{"d":"Mantenimiento preventivo por equipo","c":12,"u":"Servicio","p":950.00,"r":162},
     {"d":"Recarga de gas refrigerante","c":6,"u":"Servicio","p":600.00,"r":162}]$j$),
(7,'DPL-1-2026','DPL','Equipo','Adquisición de computadoras portátiles para producción',
 'Equipos para edición y respaldo en campo del personal de producción.',
 4,'En firma CDP',FALSE,
 $j$[{"d":"Computadora portátil 16 GB RAM, 512 GB SSD","c":3,"u":"Unidad","p":14800.00,"r":328},
     {"d":"Mouse inalámbrico","c":3,"u":"Unidad","p":175.00,"r":328}]$j$),
(8,'UI-2-2026','UI','Servicios','Licenciamiento anual de software de respaldo',
 'Renovación de la licencia que vence este mes; sin ella se pierde soporte del fabricante.',
 5,'En firma CDP',FALSE,
 $j$[{"d":"Licencia anual de software de respaldo","c":1,"u":"Licencia","p":32000.00,"r":186},
     {"d":"Soporte técnico anual","c":1,"u":"Servicio","p":6500.00,"r":186}]$j$),
(9,'UL-2-2026','UL','Materiales','Combustible diésel para vehículos de logística',
 'Abastecimiento para las comisiones de producción y traslado de equipo.',
 6,'En firma CDP',FALSE,
 $j$[{"d":"Combustible diésel","c":800,"u":"Galón","p":28.50,"r":262}]$j$),
(10,'UM-2-2026','UM','Equipo','Micrófonos inalámbricos para transmisión',
 'Sustitución de micrófonos dañados en transmisiones en vivo.',
 7,'Revisión Jurídica',FALSE,
 $j$[{"d":"Micrófono inalámbrico de solapa","c":4,"u":"Unidad","p":3250.00,"r":326},
     {"d":"Audífonos de monitoreo profesionales","c":4,"u":"Unidad","p":890.00,"r":326}]$j$),
(11,'DIP-2-2026','DIP','Servicios','Diseño y diagramación de revista institucional',
 'Cuatro ediciones de la revista institucional del ejercicio.',
 8,'Aprobación Jefatura',FALSE,
 $j$[{"d":"Diseño y diagramación por edición","c":4,"u":"Edición","p":5800.00,"r":121}]$j$),
(12,'URH-1-2026','URH','Servicios','Capacitación en atención al usuario para el personal',
 'Fortalecimiento de competencias del personal de atención al público.',
 9,'Pendiente Autorización Final',FALSE,
 $j$[{"d":"Taller de atención al usuario (jornada completa)","c":2,"u":"Taller","p":14500.00,"r":185}]$j$),
(13,'UT-2-2026','UT','Equipo','Monitores de referencia para edición de video',
 'Se requiere calibración de color confiable en las estaciones de edición.',
 10,'Expediente en Conformación',FALSE,
 $j$[{"d":"Monitor de referencia 27 pulgadas","c":2,"u":"Unidad","p":9800.00,"r":328},
     {"d":"Soporte articulado para monitor","c":2,"u":"Unidad","p":780.00,"r":322}]$j$),
(14,'DPL-2-2026','DPL','Suministros','Suministros de oficina y papelería para producción',
 'Reposición de insumos para el área de producción.',
 11,'Expediente en Conformación',FALSE,
 $j$[{"d":"Caja de marcadores permanentes","c":30,"u":"Caja","p":85.00,"r":291},
     {"d":"Pizarra de corcho 60x90 cm","c":4,"u":"Unidad","p":420.00,"r":322},
     {"d":"Rollo de cinta adhesiva","c":50,"u":"Rollo","p":12.50,"r":291}]$j$),
(15,'USG-2-2026','USG','Materiales','Materiales de limpieza para las instalaciones',
 'Abastecimiento trimestral de insumos de limpieza.',
 11,'Expediente en Conformación',FALSE,
 $j$[{"d":"Desinfectante multiuso","c":40,"u":"Galón","p":58.00,"r":292},
     {"d":"Papel higiénico institucional","c":60,"u":"Paquete","p":74.00,"r":292},
     {"d":"Bolsas plásticas industriales","c":30,"u":"Paquete","p":45.00,"r":292}]$j$),
(16,'UI-3-2026','UI','Equipo','Estaciones de trabajo para la Unidad de Informática',
 'Renovación de equipos de más de 6 años de antigüedad.',
 12,'Expediente en Conformación',FALSE,
 $j$[{"d":"Estación de trabajo Core i7, 16 GB RAM","c":2,"u":"Unidad","p":16250.00,"r":328},
     {"d":"Monitor 24 pulgadas","c":2,"u":"Unidad","p":1450.00,"r":328}]$j$),
(17,'UM-3-2026','UM','Servicios','Suscripción a plataforma de análisis de redes sociales',
 'Suscripción anual para análisis de conversación digital.',
 13,'Fase Financiera / Liquidación',FALSE,
 $j$[{"d":"Suscripción mensual a plataforma de análisis","c":12,"u":"Mes","p":2900.00,"r":186}]$j$),
(18,'DIP-3-2026','DIP','Materiales','Impresión de memoria de labores',
 'Memoria anual de labores para entrega a autoridades.',
 14,'Fase Financiera / Liquidación',FALSE,
 $j$[{"d":"Memoria de labores impresa, full color","c":300,"u":"Ejemplar","p":92.00,"r":122}]$j$),
(19,'DPL-3-2026','DPL','Equipo','Discos duros externos para respaldo de material audiovisual',
 'Respaldo del archivo audiovisual generado por producción.',
 15,'Fase Financiera / Liquidación',FALSE,
 $j$[{"d":"Disco duro externo 4 TB","c":6,"u":"Unidad","p":2350.00,"r":328},
     {"d":"Estuche protector para disco duro","c":6,"u":"Unidad","p":125.00,"r":328}]$j$),
(20,'UL-3-2026','UL','Servicios','Mantenimiento correctivo de vehículo pick-up',
 'Reparación de transmisión del vehículo asignado a logística.',
 16,'Fase Financiera / Liquidación',FALSE,
 $j$[{"d":"Reparación de transmisión","c":1,"u":"Servicio","p":18900.00,"r":165},
     {"d":"Repuestos y lubricantes","c":1,"u":"Lote","p":6400.00,"r":165}]$j$),
(21,'UA-1-2026','UA','Suministros','Tóner y cartuchos para impresoras',
 'Insumos para las impresoras de la unidad.',
 1,'Devuelto con Observaciones',FALSE,
 $j$[{"d":"Tóner negro para impresora láser","c":12,"u":"Unidad","p":850.00,"r":291}]$j$),
(22,'UT-3-2026','UT','Equipo','Kit de iluminación LED para estudio',
 'Iluminación del estudio de televisión.',
 5,'Devuelto con Observaciones',TRUE,
 $j$[{"d":"Kit de iluminación LED con soporte","c":3,"u":"Kit","p":21500.00,"r":326},
     {"d":"Difusor para panel LED","c":6,"u":"Unidad","p":480.00,"r":326}]$j$),
(23,'UM-4-2026','UM','Servicios','Cobertura fotográfica de eventos institucionales',
 'Cobertura de ocho eventos programados en el semestre.',
 3,'Pendiente Cotización',FALSE,
 $j$[{"d":"Cobertura fotográfica por evento","c":8,"u":"Evento","p":2400.00,"r":189}]$j$),
(24,'DPL-4-2026','DPL','Equipo','Trípodes y estabilizadores para producción',
 'Accesorios para grabación en exteriores.',
 17,'Pagado y Archivado',FALSE,
 $j$[{"d":"Trípode profesional de fluido","c":4,"u":"Unidad","p":3150.00,"r":326},
     {"d":"Estabilizador gimbal para cámara","c":2,"u":"Unidad","p":4800.00,"r":326}]$j$),
(25,'USG-3-2026','USG','Servicios','Servicio de fumigación de instalaciones',
 'Control de plagas semestral en las instalaciones.',
 17,'Pagado y Archivado',FALSE,
 $j$[{"d":"Servicio de fumigación integral","c":2,"u":"Servicio","p":6750.00,"r":189}]$j$),
(26,'UI-4-2026','UI','Materiales','Cable UTP categoría 6 y accesorios de red',
 'Cableado de nuevos puntos de red.',
 17,'Pagado y Archivado',FALSE,
 $j$[{"d":"Bobina de cable UTP cat. 6 (305 m)","c":6,"u":"Bobina","p":1250.00,"r":297},
     {"d":"Conector RJ45 cat. 6 (caja x100)","c":10,"u":"Caja","p":165.00,"r":297},
     {"d":"Faceplate doble con conectores","c":40,"u":"Unidad","p":22.00,"r":297}]$j$),
(27,'DIP-4-2026','DIP','Servicios','Producción de spots de radio',
 'Spots para campaña de divulgación.',
 3,'Cancelado / Desierto',FALSE,
 $j$[{"d":"Producción de spot de radio (30 seg)","c":5,"u":"Spot","p":6000.00,"r":121}]$j$);

-- ---------------------------------------------------------
-- 3) Expedientes + renglones
-- ---------------------------------------------------------
INSERT INTO expedientes
    (codigo_expediente, id_unidad_solicitante, usuario_solicitante_id, funcionario_responsable,
     funcionario_responsable_id, objeto_compra, justificacion, modalidad, id_estado_actual,
     tipo_compra, tiene_anexo, anexo_caracteristicas_tecnicas, anexo_especificaciones_especiales,
     firma2_usuario_id, firma2_cargo, fecha_creacion, fecha_actualizacion)
SELECT
    s.codigo, un.id_unidad, u.solicitante,
    CASE WHEN s.paso >= 2 THEN 'Prueba - Analista de Adquisiciones' END,
    CASE WHEN s.paso >= 2 THEN u.analista END,
    s.objeto, s.justificacion, 'Baja Cuantía', est.id_estado,
    s.tipo, s.anexo,
    CASE WHEN s.anexo THEN 'Ver especificaciones técnicas mínimas del equipo solicitado.' END,
    CASE WHEN s.anexo THEN E'Garantía mínima de 12 meses\nEntrega e instalación incluidas\nManuales en español' END,
    u.subdespacho, 'Jefe de Unidad',
    now() - make_interval(days => 70 - 2 * s.idx),
    now() - make_interval(days => 70 - 2 * s.idx)
FROM _spec s
CROSS JOIN _u u
JOIN unidades_solicitantes un ON un.codigo_unidad = s.unidad
JOIN estados_expediente est ON est.nombre = s.estado
ORDER BY s.idx;

CREATE TEMP TABLE _x ON COMMIT DROP AS
SELECT s.idx, e.id_expediente, e.fecha_creacion AS fecha0
FROM _spec s JOIN expedientes e ON e.codigo_expediente = s.codigo;

INSERT INTO expediente_items (id_expediente, descripcion, cantidad, unidad_medida, costo_unitario_estimado, id_renglon)
SELECT x.id_expediente, it.v->>'d', (it.v->>'c')::numeric, it.v->>'u', (it.v->>'p')::numeric, r.id_renglon
FROM _spec s
JOIN _x x USING (idx)
CROSS JOIN LATERAL jsonb_array_elements(s.items) WITH ORDINALITY AS it(v, n)
JOIN renglones_presupuestarios r ON r.numero_renglon = (it.v->>'r')::int
ORDER BY s.idx, it.n;

UPDATE expedientes e
SET monto_estimado = (SELECT SUM(subtotal_estimado) FROM expediente_items i WHERE i.id_expediente = e.id_expediente);

-- ---------------------------------------------------------
-- 4) Cotizaciones (CU-02): 3 por expediente (2 en USG-1-2026). La #1 es la más baja y es la
--    adjudicada cuando paso >= 4. DIP-4-2026 (desierto): ninguna cumple especificaciones.
-- ---------------------------------------------------------
INSERT INTO cotizaciones
    (id_expediente, id_proveedor, monto_ofertado, plazo_entrega_dias, garantia_meses,
     cumple_especificaciones, es_adjudicada, registrado_por_usuario_id, fecha_registro)
SELECT
    x.id_expediente, p.id_proveedor, round(e.monto_estimado * k.factor, 2), k.plazo, k.garantia,
    CASE WHEN s.codigo = 'DIP-4-2026' THEN FALSE ELSE k.cumple END,
    (s.paso >= 4 AND k.n = 1),
    u.analista,
    x.fecha0 + interval '24 hours' + k.n * interval '2 hours'
FROM _spec s
JOIN _x x USING (idx)
JOIN expedientes e ON e.id_expediente = x.id_expediente
CROSS JOIN _u u
JOIN (VALUES (1, 0.92, 5, 12, TRUE), (2, 0.97, 10, 6, TRUE), (3, 1.04, 15, 12, FALSE))
     AS k(n, factor, plazo, garantia, cumple)
     ON k.n <= CASE WHEN s.codigo = 'USG-1-2026' THEN 2 ELSE 3 END
JOIN LATERAL (
    SELECT q.id_proveedor
    FROM (SELECT id_proveedor, row_number() OVER (ORDER BY id_proveedor) AS rn
          FROM proveedores
          WHERE nit IN ('1000001-1','1000002-2','1000003-3','1000004-4','1000005-5','1000006-6')) q
    WHERE q.rn = ((s.idx + k.n) % 6) + 1
) p ON TRUE
WHERE s.paso >= 3
ORDER BY s.idx, k.n;

-- ---------------------------------------------------------
-- 5) CDP (CU-03): Borrador (paso 5) -> Aprobado Técnicamente (6) -> Aprobado en firme (>= 7)
-- ---------------------------------------------------------
INSERT INTO cdp
    (id_expediente, id_partida, numero_cdp, monto_reservado, estado, elaborado_por_usuario_id,
     fecha_elaboracion, aprobado_presupuesto_usuario_id, fecha_aprobacion_presupuesto,
     firma_hash_presupuesto, vobo_udaf_usuario_id, fecha_vobo_udaf, firma_hash_udaf)
SELECT
    x.id_expediente, pp.id_partida,
    'CDP-2026-' || lpad((row_number() OVER (ORDER BY s.idx))::text, 4, '0'),
    c.monto_ofertado,
    CASE WHEN s.paso = 5 THEN 'Borrador' WHEN s.paso = 6 THEN 'Aprobado Técnicamente' ELSE 'Aprobado' END,
    u.asistente, x.fecha0 + 4 * interval '12 hours',
    CASE WHEN s.paso >= 6 THEN u.encargado END,
    CASE WHEN s.paso >= 6 THEN x.fecha0 + 5 * interval '12 hours' END,
    CASE WHEN s.paso >= 6 THEN pg_temp.h('cdp:' || x.id_expediente || ':aprobacion:' || u.encargado) END,
    CASE WHEN s.paso >= 7 THEN u.udaf END,
    CASE WHEN s.paso >= 7 THEN x.fecha0 + 6 * interval '12 hours' END,
    CASE WHEN s.paso >= 7 THEN pg_temp.h('cdp:' || x.id_expediente || ':vobo:' || u.udaf) END
FROM _spec s
JOIN _x x USING (idx)
CROSS JOIN _u u
JOIN cotizaciones c ON c.id_expediente = x.id_expediente AND c.es_adjudicada
JOIN LATERAL (SELECT ei.id_renglon FROM expediente_items ei
              WHERE ei.id_expediente = x.id_expediente ORDER BY ei.id_item LIMIT 1) it ON TRUE
JOIN partidas_presupuestarias pp
     ON pp.ejercicio_fiscal = 2026 AND pp.programa = '11' AND pp.actividad = '001'
    AND pp.fuente_financiamiento = '11 - Ingresos Corrientes' AND pp.id_renglon = it.id_renglon
WHERE s.paso >= 5
ORDER BY s.idx;

-- Saldo disponible = asignado - CDP aprobados en firme (lo que hace voboCdp en el backend)
UPDATE partidas_presupuestarias p
SET monto_disponible = p.monto_asignado - COALESCE((
    SELECT SUM(c.monto_reservado) FROM cdp c WHERE c.id_partida = p.id_partida AND c.estado = 'Aprobado'), 0);

-- ---------------------------------------------------------
-- 6) Órdenes de compra (CU-04): Borrador (8) -> Aprobada Jefatura (9) -> Emitida (>= 10)
-- ---------------------------------------------------------
INSERT INTO ordenes_compra
    (id_expediente, id_cdp, id_proveedor_adjudicado, numero_oc, monto_total, plazo_entrega, lugar_entrega,
     estado, elaborado_por_usuario_id, aprobado_jefe_usuario_id, fecha_aprobacion_jefe, firma_hash_jefe,
     autorizado_directora_usuario_id, fecha_autorizacion_directora, firma_hash_directora,
     fecha_notificacion_proveedor)
SELECT
    x.id_expediente, cd.id_cdp, c.id_proveedor,
    'OC-2026-' || lpad((row_number() OVER (ORDER BY s.idx))::text, 4, '0'),
    c.monto_ofertado, c.plazo_entrega_dias || ' días calendario',
    CASE WHEN s.tipo = 'Servicios' THEN 'Instalaciones de la SCSPR' ELSE 'Almacén de la SCSPR' END,
    CASE WHEN s.paso = 8 THEN 'Borrador' WHEN s.paso = 9 THEN 'Aprobada Jefatura' ELSE 'Emitida' END,
    u.analista,
    CASE WHEN s.paso >= 9 THEN u.jefe END,
    CASE WHEN s.paso >= 9 THEN x.fecha0 + 8 * interval '12 hours' END,
    CASE WHEN s.paso >= 9 THEN pg_temp.h('oc:' || x.id_expediente || ':jefe:' || u.jefe) END,
    CASE WHEN s.paso >= 10 THEN u.directora END,
    CASE WHEN s.paso >= 10 THEN x.fecha0 + 9 * interval '12 hours' END,
    CASE WHEN s.paso >= 10 THEN pg_temp.h('oc:' || x.id_expediente || ':directora:' || u.directora) END,
    CASE WHEN s.paso >= 10 THEN x.fecha0 + 9 * interval '12 hours' + interval '1 hour' END
FROM _spec s
JOIN _x x USING (idx)
CROSS JOIN _u u
JOIN cotizaciones c ON c.id_expediente = x.id_expediente AND c.es_adjudicada
JOIN cdp cd ON cd.id_expediente = x.id_expediente
WHERE s.paso >= 8
ORDER BY s.idx;

-- ---------------------------------------------------------
-- 7) Recepción (CU-05) y documentos de soporte (CU-06)
--    USG-2-2026 queda "recibido con observaciones" (faltante del proveedor).
-- ---------------------------------------------------------
INSERT INTO recepciones
    (id_orden_compra, fecha_hora_recepcion, recibido_conforme, dictamen_fisico,
     tecnico_receptor_usuario_id, custodio_almacen_usuario_id, observaciones)
SELECT
    oc.id_orden_compra, x.fecha0 + 10 * interval '12 hours',
    (s.codigo <> 'USG-2-2026'),
    'DF-2026-' || lpad(s.idx::text, 3, '0'),
    u.analista,
    CASE WHEN s.tipo = 'Servicios' THEN NULL ELSE u.recepcion END,
    CASE WHEN s.codigo = 'USG-2-2026'
         THEN 'Faltan 6 paquetes de papel higiénico y 2 galones de desinfectante; el proveedor debe reponer.'
         ELSE 'Recibido a satisfacción, sin observaciones.' END
FROM _spec s
JOIN _x x USING (idx)
CROSS JOIN _u u
JOIN ordenes_compra oc ON oc.id_expediente = x.id_expediente
WHERE s.paso >= 11
ORDER BY s.idx;

INSERT INTO documentos_soporte
    (id_expediente, tipo_documento, numero_documento, archivo_url, fecha_documento, subido_por_usuario_id, fecha_carga)
SELECT
    x.id_expediente, d.tipo,
    d.prefijo || '-2026-' || lpad(s.idx::text, 4, '0'),
    'adquisiciones/documentos-soporte/seed-placeholder.pdf',
    (x.fecha0 + 11 * interval '12 hours')::date,
    u.analista,
    x.fecha0 + 11 * interval '12 hours'
FROM _spec s
JOIN _x x USING (idx)
CROSS JOIN _u u
JOIN (VALUES
    ('FACTURA',                  'FAC', TRUE,  TRUE),
    ('HOJA_1H_INGRESO',          '1H',  TRUE,  FALSE),
    ('EGRESO_ALMACEN',           'EGR', TRUE,  FALSE),
    ('CERTIFICADO_SATISFACCION', 'CER', FALSE, TRUE)
) AS d(tipo, prefijo, bienes, servicios)
  ON (CASE WHEN s.tipo = 'Servicios' THEN d.servicios ELSE d.bienes END)
WHERE s.paso >= 12
ORDER BY s.idx, d.tipo;

-- ---------------------------------------------------------
-- 8) Fase financiera (CU-07/08/09)
-- ---------------------------------------------------------
INSERT INTO compromisos_presupuestarios
    (id_expediente, numero_comp, monto_comprometido, registrado_por_usuario_id, fecha_registro, estado)
SELECT x.id_expediente,
       'COMP-2026-' || lpad((row_number() OVER (ORDER BY s.idx))::text, 4, '0'),
       oc.monto_total, u.encargado, x.fecha0 + 13 * interval '12 hours', 'Registrado'
FROM _spec s JOIN _x x USING (idx) CROSS JOIN _u u
JOIN ordenes_compra oc ON oc.id_expediente = x.id_expediente
WHERE s.paso >= 14
ORDER BY s.idx;

INSERT INTO devengados
    (id_compromiso, numero_dev, monto_devengado, retencion_isr, registrado_por_usuario_id, fecha_registro, estado)
SELECT cp.id_compromiso,
       'DEV-2026-' || lpad((row_number() OVER (ORDER BY s.idx))::text, 4, '0'),
       cp.monto_comprometido, round(cp.monto_comprometido / 1.12 * 0.05, 2),
       u.contabilidad, x.fecha0 + 14 * interval '12 hours', 'Registrado'
FROM _spec s JOIN _x x USING (idx) CROSS JOIN _u u
JOIN compromisos_presupuestarios cp ON cp.id_expediente = x.id_expediente
WHERE s.paso >= 15
ORDER BY s.idx;

INSERT INTO solicitudes_pago
    (id_devengado, entidad_bancaria, tipo_cuenta, numero_cuenta, numero_transferencia_cheque,
     solicitado_por_usuario_id, fecha_solicitud, tramitado_por_usuario_id, fecha_tramite, estado, fecha_archivo)
SELECT dv.id_devengado,
       (ARRAY['Banrural','Banco Industrial','BAC Credomatic'])[1 + s.idx % 3],
       CASE WHEN s.idx % 2 = 0 THEN 'Monetaria' ELSE 'Ahorro' END,
       '00-0000-' || lpad(s.idx::text, 6, '0'),
       CASE WHEN s.paso >= 17 THEN 'TRF-2026-' || lpad(s.idx::text, 5, '0') END,
       u.contabilidad, x.fecha0 + 15 * interval '12 hours',
       CASE WHEN s.paso >= 17 THEN u.subdespacho END,
       CASE WHEN s.paso >= 17 THEN x.fecha0 + 16 * interval '12 hours' END,
       CASE WHEN s.paso >= 17 THEN 'Tramitado' ELSE 'Pendiente' END,
       CASE WHEN s.paso >= 17 THEN x.fecha0 + 16 * interval '12 hours' END
FROM _spec s JOIN _x x USING (idx) CROSS JOIN _u u
JOIN compromisos_presupuestarios cp ON cp.id_expediente = x.id_expediente
JOIN devengados dv ON dv.id_compromiso = cp.id_compromiso
WHERE s.paso >= 16
ORDER BY s.idx;

-- ---------------------------------------------------------
-- 9) Devoluciones con observaciones (flujos A1/A2)
--    UA-1-2026: pendiente y VENCIDA · UT-3-2026: pendiente, vence hoy · UM-4-2026: ya subsanada
-- ---------------------------------------------------------
INSERT INTO devoluciones_observaciones
    (id_expediente, etapa_origen, motivo, descripcion, usuario_revisor_id, fecha_devolucion,
     plazo_subsanacion_dias, fecha_limite, estado, fecha_subsanacion)
SELECT x.id_expediente, d.etapa, d.motivo, d.descripcion,
       CASE d.revisor WHEN 'recepcion' THEN u.recepcion WHEN 'encargado' THEN u.encargado ELSE u.analista END,
       now() - make_interval(days => d.dias_atras),
       d.plazo, now() - make_interval(days => d.dias_atras) + make_interval(days => d.plazo),
       d.estado,
       CASE WHEN d.estado = 'Subsanada' THEN now() - make_interval(days => d.dias_atras - 2) END
FROM (VALUES
    ('UA-1-2026',  'Solicitud',  'Solicitud incompleta',
     'Falta la segunda firma y el detalle de especificaciones técnicas de los renglones.',
     'recepcion', 8, 5, 'Pendiente'),
    ('UT-3-2026',  'CDP',        'Monto del CDP no coincide con la cotización adjudicada',
     'El monto del borrador de CDP difiere de la oferta adjudicada; corregir y volver a enviar.',
     'encargado', 3, 3, 'Pendiente'),
    ('UM-4-2026',  'Cotizacion', 'Cotizaciones sin vigencia de oferta',
     'Las ofertas no indican vigencia. Se solicitó a los proveedores complementarla.',
     'analista', 20, 5, 'Subsanada')
) AS d(codigo, etapa, motivo, descripcion, revisor, dias_atras, plazo, estado)
JOIN _spec s ON s.codigo = d.codigo
JOIN _x x USING (idx)
CROSS JOIN _u u;

-- ---------------------------------------------------------
-- 10) Bitácora de trazabilidad (append-only): un evento por cada paso alcanzado
-- ---------------------------------------------------------
CREATE TEMP TABLE _acc (n int, accion text, entidad text, quien text, obs text) ON COMMIT DROP;
INSERT INTO _acc VALUES
(1,  'Expediente creado',                          'expedientes',                 'solicitante',  'Solicitud de compra emitida por la unidad solicitante.'),
(2,  'Expediente asignado',                        'expedientes',                 'recepcion',    'Asignado a Prueba - Analista de Adquisiciones.'),
(4,  'Cotización adjudicada',                      'cotizaciones',                'analista',     'Cotización más baja que cumple especificaciones; pasa a firma de CDP.'),
(5,  'CDP elaborado',                              'cdp',                         'asistente',    '{cdp} elaborado en borrador.'),
(6,  'CDP aprobado técnicamente',                  'cdp',                         'encargado',    '{cdp} aprobado por Encargado de Presupuesto.'),
(7,  'Vo.Bo. financiero del CDP',                  'cdp',                         'udaf',         '{cdp} aprobado en firme por UDAF.'),
(8,  'Orden de Compra elaborada',                  'ordenes_compra',              'analista',     '{oc} elaborada en borrador.'),
(9,  'Orden de Compra aprobada por Jefatura',      'ordenes_compra',              'jefe',         '{oc} aprobada técnicamente por Jefe de Adquisiciones.'),
(10, 'Orden de Compra autorizada y emitida',       'ordenes_compra',              'directora',    '{oc} autorizada en firme por Directora General. Notificada al proveedor.'),
(11, 'Recepción registrada',                       'recepciones',                 'analista',     'Recepción de {oc} registrada.'),
(12, 'Documento de soporte adjuntado',             'documentos_soporte',          'analista',     'Documentos de soporte del expediente adjuntados.'),
(13, 'Expediente trasladado a Contabilidad',       'expedientes',                 'analista',     'Expediente conformado y trasladado a la fase financiera.'),
(14, 'Compromiso presupuestario registrado',       'compromisos_presupuestarios', 'encargado',    '{comp} registrado.'),
(15, 'Devengado registrado',                       'devengados',                  'contabilidad', '{dev} registrado.'),
(16, 'Solicitud de pago trasladada',               'solicitudes_pago',            'contabilidad', 'Solicitud de pago trasladada a Sub Despacho.'),
(17, 'Pago autorizado y expediente archivado',     'solicitudes_pago',            'subdespacho',  'Pago autorizado; expediente archivado.');

CREATE TEMP TABLE _bit ON COMMIT DROP AS
SELECT x.id_expediente, x.idx, u2.uid AS usuario_id, a.accion, a.entidad,
       replace(replace(replace(replace(a.obs,
           '{cdp}',  coalesce(cd.numero_cdp, '')),
           '{oc}',   coalesce(oc.numero_oc, '')),
           '{comp}', coalesce(cp.numero_comp, '')),
           '{dev}',  coalesce(dv.numero_dev, '')) AS observacion,
       x.fecha0 + (a.n - 1) * interval '12 hours' AS fecha_hora
FROM _spec s
JOIN _x x USING (idx)
CROSS JOIN _u u
JOIN _acc a ON a.n <= s.paso
CROSS JOIN LATERAL (SELECT CASE a.quien
        WHEN 'solicitante' THEN u.solicitante WHEN 'recepcion' THEN u.recepcion
        WHEN 'analista' THEN u.analista WHEN 'asistente' THEN u.asistente
        WHEN 'encargado' THEN u.encargado WHEN 'udaf' THEN u.udaf WHEN 'jefe' THEN u.jefe
        WHEN 'directora' THEN u.directora WHEN 'contabilidad' THEN u.contabilidad
        WHEN 'subdespacho' THEN u.subdespacho END AS uid) u2
LEFT JOIN cdp cd ON cd.id_expediente = x.id_expediente
LEFT JOIN ordenes_compra oc ON oc.id_expediente = x.id_expediente
LEFT JOIN compromisos_presupuestarios cp ON cp.id_expediente = x.id_expediente
LEFT JOIN devengados dv ON dv.id_compromiso = cp.id_compromiso

UNION ALL -- una entrada por cada cotización registrada
SELECT c.id_expediente, x.idx, c.registrado_por_usuario_id, 'Cotización registrada', 'cotizaciones',
       'Oferta de ' || p.razon_social || ' por Q' || to_char(c.monto_ofertado, 'FM999,999,990.00') || '.',
       c.fecha_registro
FROM cotizaciones c
JOIN _x x ON x.id_expediente = c.id_expediente
JOIN proveedores p ON p.id_proveedor = c.id_proveedor

UNION ALL -- devoluciones
SELECT d.id_expediente, x.idx, d.usuario_revisor_id, 'Expediente devuelto con observaciones',
       'devoluciones_observaciones', d.motivo, d.fecha_devolucion
FROM devoluciones_observaciones d JOIN _x x ON x.id_expediente = d.id_expediente

UNION ALL -- subsanación
SELECT d.id_expediente, x.idx, u.solicitante, 'Observaciones subsanadas',
       'devoluciones_observaciones', 'Se subsanaron las observaciones y el expediente reingresa al proceso.',
       d.fecha_subsanacion
FROM devoluciones_observaciones d JOIN _x x ON x.id_expediente = d.id_expediente CROSS JOIN _u u
WHERE d.estado = 'Subsanada'

UNION ALL -- desierto
SELECT x.id_expediente, x.idx, u.jefe, 'Cambio de estado a "Cancelado / Desierto"', 'expedientes',
       'Proceso declarado desierto: ninguna cotización cumple con las especificaciones.',
       x.fecha0 + 3 * interval '12 hours' + interval '2 days'
FROM _spec s JOIN _x x USING (idx) CROSS JOIN _u u
WHERE s.estado = 'Cancelado / Desierto';

INSERT INTO bitacora_trazabilidad
    (id_expediente, usuario_id, accion, entidad_relacionada, observacion, hash_integridad, ip_origen, fecha_hora)
SELECT b.id_expediente, b.usuario_id, b.accion, b.entidad, b.observacion,
       pg_temp.h(b.id_expediente || '|' || b.accion || '|' || b.fecha_hora::text),
       '10.10.' || (b.idx % 5 + 1) || '.' || (20 + b.idx),
       b.fecha_hora
FROM _bit b
ORDER BY b.id_expediente, b.fecha_hora, b.accion;

UPDATE expedientes e
SET fecha_actualizacion = (SELECT MAX(fecha_hora) FROM bitacora_trazabilidad b WHERE b.id_expediente = e.id_expediente);

COMMIT;

-- ---------------------------------------------------------
-- Resumen
-- ---------------------------------------------------------
SELECT est.id_estado, est.nombre AS estado, COUNT(e.*) AS expedientes
FROM estados_expediente est
LEFT JOIN expedientes e ON e.id_estado_actual = est.id_estado
GROUP BY est.id_estado, est.nombre ORDER BY est.id_estado;
