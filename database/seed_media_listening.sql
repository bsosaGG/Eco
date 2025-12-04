-- Script para generar datos de prueba para Escucha a Medios
-- Genera 200 registros distribuidos en los últimos 3 meses

DO $$
DECLARE
    v_medio_id INTEGER;
    v_respuesta_id INTEGER;
    v_periodista TEXT;
    v_email TEXT;
    v_fecha TIMESTAMP;
    v_temas TEXT[] := ARRAY['Corrupción', 'Salud', 'Educación', 'Infraestructura', 'Seguridad', 'Economía', 'Turismo', 'Medio Ambiente', 'Cultura', 'Deportes'];
    v_tema_seleccionado TEXT;
    i INTEGER;
    j INTEGER;
    v_num_temas INTEGER;
BEGIN
    -- Loop para crear 200 respuestas
    FOR i IN 1..2000 LOOP
        -- Seleccionar un medio aleatorio (1-5 son medios fijos, 6 es Otro)
        v_medio_id := floor(random() * 6 + 1)::int;
        
        -- Generar datos aleatorios
        v_periodista := 'Periodista ' || i;
        v_email := 'periodista' || i || '@medio' || v_medio_id || '.com';
        
        -- Fecha aleatoria en los últimos 90 días
        v_fecha := NOW() - (random() * interval '900 days');
        
        -- Insertar cabecera
        INSERT INTO respuestas_medios (id_medio, nombre_periodista, email, nombre_medio_otro, fecha_creacion)
        VALUES (
            v_medio_id, 
            v_periodista, 
            v_email, 
            CASE WHEN v_medio_id = 6 THEN 'Medio Independiente ' || i ELSE NULL END,
            v_fecha
        )
        RETURNING id INTO v_respuesta_id;
        
        -- Insertar entre 1 y 3 temas por respuesta
        v_num_temas := floor(random() * 3 + 1)::int;
        
        FOR j IN 1..v_num_temas LOOP
            v_tema_seleccionado := v_temas[floor(random() * array_length(v_temas, 1) + 1)::int];
            
            INSERT INTO temas_respuesta (id_respuesta, prioridad, descripcion)
            VALUES (v_respuesta_id, j, v_tema_seleccionado || ' - Detalle del tema ' || j || ' para respuesta ' || i);
        END LOOP;
        
    END LOOP;
END $$;
