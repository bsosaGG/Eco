-- Script para agregar permisos del módulo de agendas

INSERT INTO permisos (clave_permiso, descripcion)
VALUES
    ('agendas:read', 'Acceso básico al módulo de agendas.'),
    ('agendas:create', 'Permite llenar/editar la ficha del ministerio asignado.'),
    ('agendas:view-all', 'Permite ver la Matriz Consolidada (para el Jefe).')
ON CONFLICT (clave_permiso) DO UPDATE 
    SET descripcion = EXCLUDED.descripcion; 
-- Nota: Cambié "DO NOTHING" a "DO UPDATE" por si quieres corregir tildes en registros ya existentes.
-- Si prefieres no tocar lo existente, regresa a DO NOTHING.