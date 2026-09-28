-- ============================================================================
-- MIGRACIÓN: CARGA MASIVA DE COLABORADORES DESDE Base de datos.xlsx
-- Fecha: 2026-09-18
-- SCSPR - Despacho Superior y Despacho Subsecretaría
-- ============================================================================

-- Asegurar que cui_dpi admita UUIDs temporales
ALTER TABLE personas ALTER COLUMN cui_dpi TYPE VARCHAR(64);

-- Colaborador: Karina García (011 - SECRETARIA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA DE LA REPÚBLICA)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    '510523ce-a019-51d3-b8c9-c6b5b1696471', '73d20b44-8435-591b-a5e0-794587a5c443', '9051090-6', '47461995',
    'Karina', 'Judith', 'García', 'Ruano',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5554-7461', 'karina.garcia@scspr.gob.gt', 'https://ui-avatars.com/api/?name=KARINA+GARCÍA&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '634828e2-f284-5231-86c9-cfad08c1d3c4', '510523ce-a019-51d3-b8c9-c6b5b1696471', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401',
    'SCSPR-011-2026-001', '11130005-101-00-0101-0001-011',
    '2025-11-17', NULL, 51625.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    '510523ce-a019-51d3-b8c9-c6b5b1696471', 'LICENCIATURA', 'LICENCIADA EN CIENCIAS DE LA COMUNICACIÓN', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: María Hércules (029 - ASESORA PROFESIONAL)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    'e4b1f0e9-afb5-5489-a9d6-c28fbb587292', 'd2e60fc9-084d-545c-abd7-b0a6e7c63c5b', '8516281-4', NULL,
    'María', 'Lourdes', 'Hércules', 'Magaña',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5555-5414', 'maria.hercules@scspr.gob.gt', 'https://ui-avatars.com/api/?name=MARÍA+HÉRCULES&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '3b50ccb0-fcc3-58fb-9f25-36d8c44534f7', 'e4b1f0e9-afb5-5489-a9d6-c28fbb587292', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401',
    'SCSPR-029-2026-002', '11130005-101-00-0101-0001-029',
    '2024-01-19', '2026-12-31', 30000.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    'e4b1f0e9-afb5-5489-a9d6-c28fbb587292', 'LICENCIATURA', 'LICENCIADA EN COMUNICACIÓN Y PERIODISMO', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Julio Cancinos (029 - SERVICIOS TÉCNICOS)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    '43a38dd1-fbb7-5a33-ba33-77bc3bbe0c01', 'bbe8f97b-0126-5814-ab6c-c9222fce1df7', '9744973-7', NULL,
    'Julio', 'Alberto', 'Cancinos', 'Cifuentes',
    '1988-06-15', 'MASCULINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5556-0032', 'julio.cancinos@scspr.gob.gt', 'https://ui-avatars.com/api/?name=JULIO+CANCINOS&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    'b5d954d6-c96d-50ff-809c-94654238f2cf', '43a38dd1-fbb7-5a33-ba33-77bc3bbe0c01', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401',
    'SCSPR-029-2026-003', '11130005-101-00-0101-0001-029',
    '2025-12-01', '2026-12-31', 15000.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    '43a38dd1-fbb7-5a33-ba33-77bc3bbe0c01', 'DIVERSIFICADO', 'BACHILLER EN CIENCIAS Y LETRAS', 'Ministerio de Educación', NULL
);


-- Colaborador: Dénnys Mejía (029 - SERVICIOS PROFESIONALES)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    '44f822e9-6e49-5357-b694-826c8dc7b1a3', '88f9c9ca-fb6d-525a-acf9-7b057cc257e9', '5024656-1', NULL,
    'Dénnys', 'Eduardo', 'Mejía', 'Bardales',
    '1988-06-15', 'MASCULINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5559-0243', 'dennys.mejia@scspr.gob.gt', 'https://ui-avatars.com/api/?name=DÉNNYS+MEJÍA&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '1d0b4c16-5974-5217-b105-f3b054ee7a1b', '44f822e9-6e49-5357-b694-826c8dc7b1a3', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401',
    'SCSPR-029-2026-004', '11130005-101-00-0101-0001-029',
    '2026-01-02', '2026-12-31', 28000.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    '44f822e9-6e49-5357-b694-826c8dc7b1a3', 'LICENCIATURA', 'LICENCIADO EN COMUNICACIÓN Y DISEÑO', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Héctor Sánchez (029 - SERVICIOS PROFESIONALES)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    'd69e21a5-4bc8-57be-afb9-5e16a4c1cbb7', 'c260d3ce-ac0d-5607-b38f-3e1f616ac49d', '3362943-3', NULL,
    'Héctor', 'Haroldo', 'Sánchez', 'Valencia',
    '1988-06-15', 'MASCULINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5551-1181', 'hector.sanchez@scspr.gob.gt', 'https://ui-avatars.com/api/?name=HÉCTOR+SÁNCHEZ&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '7cfe9447-2832-5d33-9025-4649d27f8ad7', 'd69e21a5-4bc8-57be-afb9-5e16a4c1cbb7', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401',
    'SCSPR-029-2026-005', '11130005-101-00-0101-0001-029',
    '2026-01-02', '2026-12-31', 30000.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    'd69e21a5-4bc8-57be-afb9-5e16a4c1cbb7', 'LICENCIATURA', 'LICENCIADO EN PERIODISMO', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Brayan Marroquín (183 - SERVICIOS PROFESIONALES)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    'ac5461c1-a8ff-5873-a5e3-a2ad8e728770', '615ae98e-51d0-545f-87ec-dba2ce568072', '1164860-8', NULL,
    'Brayan', 'Lisnoel', 'Marroquín', 'Rivera',
    '1988-06-15', 'MASCULINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5553-0535', 'brayan.marroquin@scspr.gob.gt', 'https://ui-avatars.com/api/?name=BRAYAN+MARROQUÍN&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '1b54f9d8-abf8-5f94-92ed-ef990f897411', 'ac5461c1-a8ff-5873-a5e3-a2ad8e728770', '33333333-3333-3333-3333-333333333305', '44444444-4444-4444-4444-444444444401',
    'SCSPR-183-2026-006', '11130005-101-00-0101-0001-183',
    '2026-02-16', '2026-12-31', 0.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    'ac5461c1-a8ff-5873-a5e3-a2ad8e728770', 'LICENCIATURA', 'LICENCIADO EN CIENCIAS JURÍDICAS Y SOCIALES, ABOGADO Y NOTARIO', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Angela Castillo (021 - RECEPCIONISTA)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    '097f42b4-4db3-50c9-8882-8eb41df95d9a', 'c32e82a3-78f5-5968-ba24-f568fc2ad23f', '6437038-4', '26740265',
    'Angela', 'Isabel', 'Castillo', 'Rodriguez',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5552-6740', 'angela.castillo@scspr.gob.gt', 'https://ui-avatars.com/api/?name=ANGELA+CASTILLO&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '7c82a7e1-49d1-5adc-b418-f68025a9f1dc', '097f42b4-4db3-50c9-8882-8eb41df95d9a', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444401',
    'SCSPR-021-2026-007', '11130005-101-00-0101-0001-021',
    '2026-03-16', '2026-12-31', 5250.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    '097f42b4-4db3-50c9-8882-8eb41df95d9a', 'DIVERSIFICADO', 'BACHILLER EN CIENCIAS Y LETRAS CON ORIENTACIÓN EN DISEÑO GRÁFICO', 'Ministerio de Educación', NULL
);


-- Colaborador: Gladys Ramírez (029 - SERVICIOS PROFESIONALES)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    '0a453bc1-80a4-5b6d-a7fc-d08eda89a213', 'f5b3e8e4-2ea9-508a-b9b9-997cc70b4383', '5410186-7', NULL,
    'Gladys', 'Consuelo', 'Ramírez', 'Tzian',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5552-0709', 'gladys.ramirez@scspr.gob.gt', 'https://ui-avatars.com/api/?name=GLADYS+RAMÍREZ&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '9a403acb-91f0-5e02-a1f7-f764cecdd0d6', '0a453bc1-80a4-5b6d-a7fc-d08eda89a213', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401',
    'SCSPR-029-2026-008', '11130005-101-00-0101-0001-029',
    '2026-01-04', '2026-12-31', 20000.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    '0a453bc1-80a4-5b6d-a7fc-d08eda89a213', 'LICENCIATURA', 'LICENCIADA EN CIENCIAS DE LA COMUNICACIÓN', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Miriam Molina (029 - SERVICIOS PROFESIONALES)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    '7f3eb94e-317a-5e74-a057-eb5e201c2412', '3e023d91-c93d-508b-b9b8-3735701eaa17', '8375926-4', NULL,
    'Miriam', 'Maribel', 'Molina', 'Martinez',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5555-4581', 'miriam.molina@scspr.gob.gt', 'https://ui-avatars.com/api/?name=MIRIAM+MOLINA&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    'a9ed574d-30df-5602-8d5e-c5b483bb00bc', '7f3eb94e-317a-5e74-a057-eb5e201c2412', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401',
    'SCSPR-029-2026-009', '11130005-101-00-0101-0001-029',
    '2026-04-17', '2026-12-31', 15000.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    '7f3eb94e-317a-5e74-a057-eb5e201c2412', 'LICENCIATURA', 'LICENCIADA EN PSICOLOGÍA INDUSTRIAL/ORGANIZACIONAL', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Alicia Alvarez (029 - PROFESIONALES INDIVIDUALES EN GENERAL)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    '0175b5ba-f66e-5402-9ebf-6bef4d56ca01', '690dd3f5-5c60-56d1-bb01-ddf2b01746d1', '1946416-4', NULL,
    'Alicia', '', 'Alvarez', 'Gil',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5558-1607', 'alicia.alvarez@scspr.gob.gt', 'https://ui-avatars.com/api/?name=ALICIA+ALVAREZ&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '1f1f2caa-9fb6-59ed-8f1a-b70319cc057c', '0175b5ba-f66e-5402-9ebf-6bef4d56ca01', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401',
    'SCSPR-029-2026-010', '11130005-101-00-0101-0001-029',
    '2024-07-24', '2026-12-31', 25000.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    '0175b5ba-f66e-5402-9ebf-6bef4d56ca01', 'LICENCIATURA', 'LICENCIADA EN CIENCIAS DE LA COMUNICACIÓN', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Luisa Laguardia (029 - PROFESIONALES INDIVIDUALES EN GENERAL)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    'f9d409eb-1beb-52c5-8337-9170c5e3c661', 'bfc7980d-b116-51a6-b977-f7c07ba0a64e', '3037173-6', NULL,
    'Luisa', 'Daniela', 'Laguardia', 'Oliva',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5553-1987', 'luisa.laguardia@scspr.gob.gt', 'https://ui-avatars.com/api/?name=LUISA+LAGUARDIA&background=0B2545&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '2c19fb31-2ee0-55cc-91aa-7181c458db3a', 'f9d409eb-1beb-52c5-8337-9170c5e3c661', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401',
    'SCSPR-029-2026-011', '11130005-101-00-0101-0001-029',
    '2024-07-24', '2026-12-31', 23500.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    'f9d409eb-1beb-52c5-8337-9170c5e3c661', 'LICENCIATURA', 'LICENCIADA EN PERIODISMO Y COMUNICACIÓN', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Cecilia Morales (011 - SUBSECRETARIA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA DE LA REPÚBLICA)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    'a52d7145-634e-52ce-ba2f-8465d20b06c8', '92f9313e-f75f-53f2-8584-8a5d3b183d8a', '4087107-9', '26804635',
    'Cecilia', 'Fernanda', 'Morales', 'Lemus',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5552-6804', 'cecilia.morales@scspr.gob.gt', 'https://ui-avatars.com/api/?name=CECILIA+MORALES&background=134074&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '4c6f7d4a-8c12-5d6f-ae2c-f797f35dea07', 'a52d7145-634e-52ce-ba2f-8465d20b06c8', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444402',
    'SCSPR-011-2026-001', '11130005-101-00-0101-0001-011',
    '2025-11-19', NULL, 35398.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    'a52d7145-634e-52ce-ba2f-8465d20b06c8', 'LICENCIATURA', 'LICENCIADA EN CIENCIAS DE LA COMUNICACIÓN', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Andrea Veliz (029 - SERVICIOS TÉCNICOS)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    '0afb3d4e-1102-5046-859e-ab516e335af0', '9c55198a-da37-505a-b424-06e54c47dc5f', '4573534-4', NULL,
    'Andrea', 'Cecilia', 'Veliz', 'De paz',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5557-7039', 'andrea.veliz@scspr.gob.gt', 'https://ui-avatars.com/api/?name=ANDREA+VELIZ&background=134074&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '1ae742e8-641c-5833-85c7-6a3eaf790d74', '0afb3d4e-1102-5046-859e-ab516e335af0', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444402',
    'SCSPR-029-2026-002', '11130005-101-00-0101-0001-029',
    '2026-01-04', '2026-12-31', 15000.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    '0afb3d4e-1102-5046-859e-ab516e335af0', 'DIVERSIFICADO', 'BACHILLER EN CIENCIAS Y LETRAS CON ORIENTACIÓN EN TURISMO', 'Ministerio de Educación', NULL
);


-- Colaborador: Andrea Valdez (029 - SERVICIOS PROFESIONALES)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    '8b6b89a4-8924-5a29-ad3c-bad53efcf5b2', 'e5d22288-b2f2-5bde-aed9-5bc470b6567a', '8248813-7', NULL,
    'Andrea', 'Beatriz', 'Valdez', 'De leóm',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5555-4049', 'andrea.valdez@scspr.gob.gt', 'https://ui-avatars.com/api/?name=ANDREA+VALDEZ&background=134074&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    'bec7a7a2-4edc-5a8b-8a7d-2ea883a6f2fc', '8b6b89a4-8924-5a29-ad3c-bad53efcf5b2', '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444402',
    'SCSPR-029-2026-003', '11130005-101-00-0101-0001-029',
    '2026-08-24', '2026-12-31', 18000.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    '8b6b89a4-8924-5a29-ad3c-bad53efcf5b2', 'LICENCIATURA', 'MERCADOCTENISTA', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);


-- Colaborador: Wendy De paz (189 - SERVICIOS PROFESIONALES)
INSERT INTO personas (
    id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
) VALUES (
    'd60a5cc0-6a54-5e92-9292-692a258a31f3', 'd87011bb-6fb4-5b4e-aeaf-2b075f12ffeb', '6174847-1', NULL,
    'Wendy', 'Gabriela', 'De paz', 'Meléndez',
    '1988-06-15', 'FEMENINO', 'SOLTERO/A', 'Ciudad de Guatemala',
    '5553-5371', 'wendy.depaz@scspr.gob.gt', 'https://ui-avatars.com/api/?name=WENDY+DE PAZ&background=134074&color=EEF4F8&size=256&bold=true', TRUE
)
ON CONFLICT (cui_dpi) DO UPDATE SET
    primer_nombre = EXCLUDED.primer_nombre,
    primer_apellido = EXCLUDED.primer_apellido,
    correo_institucional = EXCLUDED.correo_institucional,
    foto_url = EXCLUDED.foto_url;

INSERT INTO relaciones_laborales (
    id, persona_id, renglon_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
    fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
) VALUES (
    '19918785-67fd-5267-916b-1dd247c2749b', 'd60a5cc0-6a54-5e92-9292-692a258a31f3', '33333333-3333-3333-3333-333333333306', '44444444-4444-4444-4444-444444444402',
    'SCSPR-189-2026-004', '11130005-101-00-0101-0001-189',
    '2026-03-19', '2026-12-31', 0.0, 'ACTIVO', TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO estudios_academicos (
    persona_id, nivel_academico, titulo_obtenido, institucion, colegio_profesional
) VALUES (
    'd60a5cc0-6a54-5e92-9292-692a258a31f3', 'LICENCIATURA', 'INTERNACIONALISTA', 'Universidad de San Carlos / Universidades de Guatemala', 'Colegio Profesional de Guatemala'
);

