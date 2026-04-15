ALTER TABLE historial_procesal 
ALTER COLUMN fecha_interposicion TYPE TIMESTAMP 
USING fecha_interposicion::TIMESTAMP + INTERVAL '6 hours';

ALTER TABLE historial_procesal add column fecha_fin TIMESTAMP;