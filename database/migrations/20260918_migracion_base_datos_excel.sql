-- ============================================================================
-- MIGRACIÓN: CARGA MASIVA DE COLABORADORES DESDE Base de datos.xlsx
-- Fecha: 2026-09-18
-- SCSPR - Despacho Superior y Despacho Subsecretaría
-- ============================================================================

-- Asegurar que cui_dpi admita UUIDs temporales
ALTER TABLE personas ALTER COLUMN cui_dpi TYPE VARCHAR(64);

-- Colaborador: Karina García (011 - SECRETARIA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA DE LA REPÚBLICA)
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    '510523ce-a019-51d3-b8c9-c6b5b1696471', '510523ce-a019-51d3-b8c9-c6b5b1696471', 'Karina', '', 'García', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    'e4b1f0e9-afb5-5489-a9d6-c28fbb587292', 'e4b1f0e9-afb5-5489-a9d6-c28fbb587292', 'María', '', 'Hércules', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    '43a38dd1-fbb7-5a33-ba33-77bc3bbe0c01', '43a38dd1-fbb7-5a33-ba33-77bc3bbe0c01', 'Julio', '', 'Cancinos', '', 'MASCULINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    '44f822e9-6e49-5357-b694-826c8dc7b1a3', '44f822e9-6e49-5357-b694-826c8dc7b1a3', 'Dénnys', '', 'Mejía', '', 'MASCULINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    'd69e21a5-4bc8-57be-afb9-5e16a4c1cbb7', 'd69e21a5-4bc8-57be-afb9-5e16a4c1cbb7', 'Héctor', '', 'Sánchez', '', 'MASCULINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    'ac5461c1-a8ff-5873-a5e3-a2ad8e728770', 'ac5461c1-a8ff-5873-a5e3-a2ad8e728770', 'Brayan', '', 'Marroquín', '', 'MASCULINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    '097f42b4-4db3-50c9-8882-8eb41df95d9a', '097f42b4-4db3-50c9-8882-8eb41df95d9a', 'Angela', '', 'Castillo', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    '0a453bc1-80a4-5b6d-a7fc-d08eda89a213', '0a453bc1-80a4-5b6d-a7fc-d08eda89a213', 'Gladys', '', 'Ramírez', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    '7f3eb94e-317a-5e74-a057-eb5e201c2412', '7f3eb94e-317a-5e74-a057-eb5e201c2412', 'Miriam', '', 'Molina', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    '0175b5ba-f66e-5402-9ebf-6bef4d56ca01', '0175b5ba-f66e-5402-9ebf-6bef4d56ca01', 'Alicia', '', 'Alvarez', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    'f9d409eb-1beb-52c5-8337-9170c5e3c661', 'f9d409eb-1beb-52c5-8337-9170c5e3c661', 'Luisa', '', 'Laguardia', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    'a52d7145-634e-52ce-ba2f-8465d20b06c8', 'a52d7145-634e-52ce-ba2f-8465d20b06c8', 'Cecilia', '', 'Morales', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    '0afb3d4e-1102-5046-859e-ab516e335af0', '0afb3d4e-1102-5046-859e-ab516e335af0', 'Andrea', '', 'Veliz', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    '8b6b89a4-8924-5a29-ad3c-bad53efcf5b2', '8b6b89a4-8924-5a29-ad3c-bad53efcf5b2', 'Andrea', '', 'Valdez', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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
-- (DATOS DE PERSONAS ANONIMIZADOS PARA CUMPLIMIENTO DE PROTECCIÓN DE DATOS)

INSERT INTO personas (
    id, cui_dpi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, genero
) VALUES (
    'd60a5cc0-6a54-5e92-9292-692a258a31f3', 'd60a5cc0-6a54-5e92-9292-692a258a31f3', 'Wendy', '', 'De paz', '', 'FEMENINO'
) ON CONFLICT (id) DO NOTHING;

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


